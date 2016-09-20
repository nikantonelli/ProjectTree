Ext.define('Rally.ui.popover.UserPopover', {
        alias: 'widget.rallyuserpopover',
        extend:  Rally.ui.popover.ListViewPopover ,

        id: 'user-popover',
        cls: 'userstory-popover',
        title: 'Users',
        titleIconCls: 'icon-story',
        maxHeight: 600,
        constructor: function(config) {

            var app = Ext.getCmp('projectApp');

            config.listViewConfig = Ext.merge({
                model: Ext.identityFn('User'),
                childField: app.getSetting('userGroup')  || 'TeamMembers',
                addNewConfig: null,
                gridConfig: {
                    stateful: true,
                    stateId: app.getContext().getScopedStateId('gridConfig'),
                    enableEditing: false,
                    store: config.recordStore,
                    columnCfgs: [
                        {
                            dataIndex: 'DisplayName',
                            width: 90
                        },
                        {
                            dataIndex: 'EmailAddress',
                            flex: 90
                        },
                        {
                            dataIndex: 'Phone',
                            width: 180
                        },
                        {
                            dataIndex: 'UserName',
                            width: 180
                        }
                    ]
                }
            }, config.listViewConfig);

            this.callParent(arguments);
        }
});

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

        pe = window.document.getElementById(this.parentTreeItem.id);

        this.insert(1, {

            xtype: 'container',
            itemId: 'treeItemContent',
            id: Ext.id(),
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
                        },
                        scope: this
                    }
                },
                {
                    xtype: 'fieldcontainer',
                    itemId: 'userInfoRecord',
                    layout: {
                        type: 'anchor'
                    },
                    defaults: {
                        layout: '100%'
                    },
                    style: {
                        marginLeft: '50px',
                        border: 15
                    },
                    listeners: {
                        afterrender: function(cmp) {
                            var treeItem = me;
                            var record = me.getRecord();
                            var app = this.up('#projectApp');

                            var fieldName = app.getSetting('userGroup') || 'TeamMembers';

                            Rally.data.ModelFactory.getModel({ type: 'User',
                                success: function(model) {

                                    var store = record.getCollection(fieldName, {
                                        filters: app._getFilters(app)
                                    });
                                    store.load().then({
                                        success: function(data) {
                                            store.model = model;
                                            var popOver;
                                            var thisPopoverCfg = {
                                                record: record,
                                                target: cmp.getTargetEl(),
                                                field: fieldName,
                                                title: fieldName,
                                                autoShow: true,
                                                recordStore: store
                                            };
                                            if (data.length > 0) {
                                                cmp.getTargetEl().on('click', function() { Ext.create('Rally.ui.popover.UserPopover', thisPopoverCfg);});
                                            }
                                            cmp.suspendLayouts();

                                            _.each(data, function(member) {
                                                var mseSelected;
                                                var thisBorder = member.get('WorkspacePermission') === 'Workspace User'? 'lightgreen' :
                                                    member.get('WorkspacePermission') === 'Project Admin'? 'orange' : 'red';
                                                var user =
                                                    {   xtype: 'textfield',
                                                        readOnly: true,
                                                        border: '0 0 0 5',
                                                        style: {
                                                            borderColor: thisBorder,
                                                            borderStyle: 'solid',
                                                            marginLeft: '10px'
                                                        },
                                                        value: member.get('_refObjectName')
                                                    };
                                                    
                                                cmp.add(user);
                                            });
                                            cmp.resumeLayouts();

                                            //If you want instant update to show the users, add this line in. If you don't the
                                            //users get shown on the next redraw of the tree - which is actually useful, unless you want to
                                            //see the userlist associated with project nodes with no children - then you have to make a redraw by expanding and
                                            //collapsing another project node
                                            cmp.updateLayout();

                                            //Bring the parent back into view
                                            pe.scrollIntoView();
                                        }
                                    });
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
    id: 'projectApp',
    stateful: true,

    getSettingsFields: function() {
        var me = this;
        return [
            {
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Show Project Admins Only',
                labelWidth: 200,
                name: 'projectAdminsOnly'
            },
            {
                xtype: 'radiogroup',
                fieldLabel: 'User Type Selection',
                labelWidth: 200,
                style: {
                    borderColor: '#e0e0e0',
                    borderStyle: 'solid none',
                    borderWidth: 'thick'
                },
                name: 'typeGroup',
                columns : 1,
                items: [
                    { boxLabel: 'Editors', name: 'userGroup', inputValue: 'Editors'},
                    { boxLabel: 'Team Members', name: 'userGroup', inputValue: 'TeamMembers' }
                ],
                listeners: {
                    afterrender: function(box){
                        box.setValue({ userGroup: me.getSetting('userGroup') || 'TeamMembers'});
                    }
                }
            }
        ];
    },

    _getFilters: function(app) {

        var filters = [];
        if (app.getSetting('userGroup') !== 'TeamMembers'){
             filters = Rally.data.wsapi.Filter.or([
                {
                    property: 'WorkspacePermission',
                    operator: '=',
                    value: 'Workspace User'
                },
                {
                    property: 'WorkspacePermission',
                    operator: '=',
                    value: 'Project Admin'
                }
            ]);
        }

        if (app.getSetting('projectAdminsOnly') === true) {
            filters = [
                {
                    property: 'WorkspacePermission',
                    value: 'Project Admin'
                }
            ];
        }
        return filters;
    },

    launch: function() {

        var app = this;


        var pt = Ext.create( 'Rally.ui.tree.ProjectTree', {

//        stateful: true,
//        stateId: app.getContext().getScopedStateId('projectTree'),

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
