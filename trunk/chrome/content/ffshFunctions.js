/* ***** BEGIN LICENSE BLOCK *****
 * Version: GPL 2.0
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.

 * The Initial Developer of FFcli is Natsakis Konstantinos.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Natsakis Konstantinos <gpl@aleph-0.net> (FFcli)
 *  Dustin J. Mitchell <dustin@v.igoro.us> (ffsh)
 *
 * ***** END LICENSE BLOCK ***** */

/* TODO: move this to a single-instance component that can take care of this sort
 * of thing, along with caching, etc. */

function ffsh_log(msg) {
	dump("ffsh: " + msg + "\n");
}

function FfshQueryObject(query_str) {
	this.query_str = query_str;

	this.open_url = function (url) {
		switch (ffsh_openin) {
			case "newTab":
				document.getElementById("content").addTab(url);
				break;
			case "newWindow":
				window.open(url);
				break;
			case "currentTab":
				document.getElementById("content").loadURI(url);
				break;
		}
	}
}

function ffsh_command(command, query) {
	/* Get some nsIFile objects set up */
	/* And get our PATH pref */
	var preferences = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);
	var searchpath = preferences.getCharPref("extensions.ffsh.searchpath");
	var i;
	var command_f;

	searchpath = searchpath.split(":");
	for (i = 0; i < searchpath.length; i++) {
		var path = searchpath[i];
		var dirsvc = Components.classes["@mozilla.org/file/directory_service;1"]
			     .getService(Components.interfaces.nsIProperties);
		var home = dirsvc.get("Home", Components.interfaces.nsIFile).path;
		var profile = dirsvc.get("ProfD", Components.interfaces.nsIFile).path;

		/* Substitute the various variables we support */
		path = path.replace(/^\$home/, home);
		path = path.replace(/^\$profile/, profile);

		/* Make an nsILocalFile out of it */
                var path_f = Components.classes["@mozilla.org/file/local;1"]
			.createInstance(Components.interfaces.nsILocalFile);
		path_f.initWithPath(path);

		if (!path_f.exists() || !path_f.isDirectory()) {
			ffsh_log("path element " + path_f.path + " (" + path + ") is not a directory");
			continue;
		}

		ffsh_log("searching " + path_f.path);
		path_f.append(command + ".js");
		if (path_f.exists() && path_f.isFile()) { 
			ffsh_log("..found " + path_f.path);
			command_f = path_f;
			break;
		}
	}

	if (!command_f) {
		alert("'" + command + "': command not found");
	} else {
		/* Load the script */
		var ssloader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
				.getService(Components.interfaces.mozIJSSubScriptLoader);
		var command_url = "file://" + command_f.path; // this is probably dead wrong
		var queryobj = new FfshQueryObject(query);
		try {
			ssloader.loadSubScript(command_url, queryobj);
		} catch (e) {
			ffsh_log("Exception from " + command + ": " + e.message);
			var error_msg = e.fileName+":"+e.lineNumber+": "+e.message;
			alert(error_msg);
		}
	}
}
