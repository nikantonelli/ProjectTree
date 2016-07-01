ProjectTree
=========================

## Overview

Shows the project tree visible to you based on your permissions and will list out the people connected to the tree node as either "Editors" or as "Team Members". The definition of these two types is taken directly from the WSAPI fields on the "User" type.

When you open up the tree node, the app will asynchronously fetch the user list and show them along side. If you click on the userlist area, a popover comes up with more user details. You can change the code to add other fields to this popover.

The red bar in front of a name indicates Workspace or SUbscription Admin status. Amber indicates Project Admi and Green indicates normal user.

![alt text](https://github.com/nikantonelli/ProjectTree/blob/master/Images/projectTreePermissions.png)

The app does not list workspace admins or subscription admins when showinf editors - these people have automatic rights to everywhere. If you want to find out who has these rights, you can either: a) take out the filters from the app, which may end up with a long list or b) talk to someone within your organisation. If you are already a workspace or subscription admin, you can find this info from the users tab after you click on the config (hammer and spanner) icon.

The app settings allow you to filter out just the project admins from the selected user class ("Team Member" or "Editor" ). 

![alt text](https://github.com/nikantonelli/ProjectTree/blob/master/Images/appOptions.png)

## License

AppTemplate is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.0/doc/)
