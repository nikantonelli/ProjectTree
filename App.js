Ext.define( 'Rally.ui.tree.extendedTreeItem' , {
    alias: 'widget.extendedTreeItem',
    extend: 'Rally.ui.tree.TreeItem',
    config: {
        displayedFields: ['Name', 'Description', 'TeamMembers']
    },

    getContentTpl: function() {
        var me = this;

        return Ext.create('Ext.XTemplate',
            '<tpl if="this.canDrag()"><div class="icon drag"></div></tpl>',
            '{[this.getActionsGear()]}',
            '<div class="textContent ellipses">{[this.getFormattedId()]} {[this.getSeparator()]}{Name} ({[this.getOwner()]})</div>',
            '<div class="rightSide">',
            '</div>',
            {
                canDrag: function() {
                    return me.getCanDrag();
                },
                getActionsGear: function() {
                    return me._buildActionsGearHtml();
                },
                getFormattedId: function() {
                    var record = me.getRecord();
                    return record.getField('FormattedID') ? Rally.ui.renderer.RendererFactory.renderRecordField(record, 'FormattedID') : '';
                },
                getSeparator: function() {
                    return this.getFormattedId() ? '- ' : '';
                },
                getOwner: function() {
                    var record = me.getRecord();
                    return record.getField('Owner') ? Rally.ui.renderer.RendererFactory.renderRecordField(record, 'Owner') : '';
                }
            }
        );
    },

    draw: function() {
        var me = this;

        if (this.content) {
            this.content.destroy();
        }

        var cls = 'treeItemContent';
        if (this.getSelectable()) {
            cls += ' selectable';
        }

        if (!this.expander) {
            this.expander = this.drawExpander();
        } else {
            this.toggleExpander();
        }

        this.insert(1, {

            xtype: 'container',
            itemId: 'treeItemContent',
            overflowX: true,
            cls: cls,
            layout: {
                type: 'hbox'
            },
            items: [
                {
                    xtype: 'component',
                    renderTpl: this.getContentTpl(),
                    renderData: this.getRenderData(),
                    listeners: {
                        afterrender: function() {
                            this.setupListeners();
                            this.fireEvent('draw');
                        },
                        scope: this
                    }
                },
                {
                    xtype: 'container',
                    itemId: 'userInfoRecord',
                    layout: {
                        type: 'hbox'
                    },
                    style: {
                        marginLeft: '50px'
                    },
                    listeners: {
                        afterrender: function(cmp) {
                            var treeItem = me;
                            var record = me.getRecord();
                            var app = this.up('#projectApp');

                            var filters = [
                                {
                                    property: 'WorkspacePermission',
                                    operator: '<',
                                    value: 'Workspace Admin'
                                }
                            ];

                            if (app.getSetting('projectAdminsOnly').value === true) {
                                filters = [
                                    {
                                        property: 'WorkspacePermission',
                                        value: 'Project Admin'
                                    }
                                ];
                            }

                            var fieldName = (app.getSetting('userGroup') && app.getSetting('userGroup').getValue()) || 'TeamMembers';

                            record.getCollection(fieldName, {
                                filters: filters
                            }).load().then({
                                success: function(data) {
                                    cmp.suspendLayouts();
                                    _.each(data, function(member) {
                                        cmp.add(
                                            {   xtype: 'container',
                                                cls: 'rally-textfield-component',
                                                style: { marginLeft: '10px'},
                                                html: member.get('_refObjectName')
                                            }
                                        );
                                    });
                                    cmp.resumeLayouts();
                                }
                            });
                        }
                    }
                }
            ]
        });

    }
});

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    itemId: 'projectApp',
    stateful: true,
    stateId: 'projectApp-' + Ext.id(),

    getSettingsFields: function() {
        return [
            {
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Show Project Admins Only',
                labelWidth: 200,
                name: 'projectAdminsOnly'
            },
            {
                xtype: 'radiogroup',
                name: 'userGroup',
                fieldLabel: 'User Type Selection',
                // Arrange radio buttons into two columns, distributed vertically
                columns : 1,
                items: [
                    { boxLabel: 'Editors', name: 'rb', inputValue: 'Editors'},
                    { boxLabel: 'Team Members', name: 'rb', inputValue: 'TeamMembers', checked: true }
                ]
            }
        ];
    },

    launch: function() {

        var app = this;

        var pt = Ext.create( 'Rally.ui.tree.ProjectTree', {

        config: {
            treeItemConfigForRecordFn:  function(record) {
                if (record.get('_type') === 'workspace'){
                    return { xtype: 'rallyplaintreeitem' };
                }
                else {
                    return {
                        xtype: 'extendedTreeItem',
                        selectable: true
                    };
                }
            },
            topLevelStoreConfig: {
                fetch: ['Name', 'State', 'Workspace'],
                filters: [{
                    property: 'State',
                    value: 'Open'
                }, {
                    property: 'Projects.State',
                    value: 'Open'
                }],
                sorters: [{
                    property: 'Name',
                    direction: 'ASC'
                }],
                context: function() { app._getContext(app); }
            },

            childItemsStoreConfigForParentRecordFn: function(record){

                var storeConfig = {
                    fetch: ['Name', 'Description', 'Owner', 'Children:summary[State]', 'State', 'Workspace'],
                    hydrate: ['Owner'],
                    sorters: [{
                        property: 'Name',
                        direction: 'ASC'
                    }]
                };

                if(record.get('_type') === 'workspace'){
                    return Ext.apply(storeConfig, {
                        filters: [{
                            property: 'Parent',
                            value: 'null'
                        }],
                        context: {
                            workspace: record.get('_ref'),
                            project: null
                        }
                    });
                } else {
                    return Ext.apply(storeConfig, {
                        filters: [{
                            property: 'Parent',
                            value: record.get('_ref')
                        }],
                        context: {
                            workspace: record.get('Workspace')._ref,
                            project: null
                        }
                    });
                }
            }
        }
       });

       this.add(pt);
    }
});
