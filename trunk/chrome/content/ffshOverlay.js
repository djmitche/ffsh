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
 * ***** END LICENSE BLOCK ***** */

const CHAR_CODE_COLON = ":".charCodeAt(0);
const CHAR_CODE_SEMICOLON = ";".charCodeAt(0);

var ffsh_openin;
var ffsh_timeout = 5000;
var ffsh_timeout_handler = null;

var str_openin;
var str_openinNewTab;
var str_openinNewWindow;
var str_openinCurrentTab;

var preferences = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

window.addEventListener("load", ffsh_init, false);
window.addEventListener("unload", ffsh_uninit, false);

function ffsh_init () {
	try {
		ffsh_openin = preferences.getCharPref("extensions.ffsh.openin");
	} catch(e) {
		ffsh_openin = "currentTab";
	}

	str_openin = document.getElementById("strings").getString("openin");
	str_openinNewTab = document.getElementById("strings").getString("openinNewTab");
	str_openinNewWindow = document.getElementById("strings").getString("openinNewWindow");
	str_openinCurrentTab = document.getElementById("strings").getString("openinCurrentTab");

	document.getElementById("ffsh_mLabel").setAttribute("value", str_openin);
	document.getElementById("ffsh_mItem_newTab").setAttribute("label", str_openinNewTab);
	document.getElementById("ffsh_mItem_newWindow").setAttribute("label", str_openinNewWindow);
	document.getElementById("ffsh_mItem_currentTab").setAttribute("label", str_openinCurrentTab);

	ffsh_setPref(ffsh_openin);

	switch (ffsh_openin) {
		case "newTab":
			document.getElementById("ffsh_mList").setAttribute("label", str_openinNewTab);
			break;
		case "newWindow":
			document.getElementById("ffsh_mList").setAttribute("label", str_openinNewWindow);
			break;
		case "currentTab":
			document.getElementById("ffsh_mList").setAttribute("label", str_openinCurrentTab);
			break;
	}

	window.addEventListener("keypress", ffsh_onkeypress, false);
}

function ffsh_uninit () {
	window.removeEventListener("keypress", ffsh_onkeypress, false);
}

function ffsh_setPref (openin) {
	ffsh_openin = openin;
	preferences.setCharPref("extensions.ffsh.openin", openin);
	document.getElementById("ffsh_mList").value = openin;
}

function ffsh_onkeypress (event) {
	if(!event.ctrlKey && !ffsh_showup(event))
		return;	

	if( (!event.ctrlKey && event.charCode == CHAR_CODE_COLON) || (event.ctrlKey && event.charCode == CHAR_CODE_SEMICOLON)) {
		var ffsh_toolbar = document.getElementById("ffsh_toolbar");
		var ffsh_field = document.getElementById("ffsh_field");

		ffsh_toolbar.hidden=false;
		ffsh_field.select();
		ffsh_field.focus();

		window.addEventListener("focus", ffsh_focusChanged, true);

		ffsh_settimeout();
		event.preventDefault();
	}
}

function ffsh_focusChanged (event) {
	if( !event.target.id || (event.target.id.indexOf("ffsh") != 0) )
		setTimeout(ffsh_close, 0);
}

function ffsh_showup (event) {
	if (event.altKey || event.ctrlKey || event.metaKey || event.getPreventDefault())
		return false;

	var element = document.commandDispatcher.focusedElement;
	if (element) {
		if (element instanceof HTMLInputElement) {
			var inputType = element.type;

			switch (inputType) {
				case "text":
				case "password":
				case "file":
					return false;
			}
		} else if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element instanceof HTMLIsIndexElement)
			return false;
	}

	var win = document.commandDispatcher.focusedWindow;
	if (win && win.document.designMode == "on")
		return false;

	return true;
}

function ffsh_settimeout () {
	ffsh_cleartimeout();

	ffsh_timeout_handler = setTimeout(ffsh_close, ffsh_timeout);
}

function ffsh_cleartimeout () {
	if (ffsh_timeout_handler) {
		clearTimeout(ffsh_timeout_handler);
		ffsh_timeout_handler = null;
	}
}

function ffsh_close () {
	var ffsh_toolbar = document.getElementById("ffsh_toolbar");

	if ( ffsh_toolbar.hidden == true )
		return;

	window.removeEventListener("focus", ffsh_focusChanged, true);

	var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);

	if (window == ww.activeWindow) {
		try { window.content.focus(); } catch(e) { }
	}

	ffsh_cleartimeout();
	ffsh_toolbar.hidden=true;
}

function ffsh_field_onkeypress (event) {
	if(event.keyCode == KeyEvent.DOM_VK_RETURN ) {
		setTimeout(ffsh_close, 0);
		event.preventDefault();

		var ffsh_field = document.getElementById("ffsh_field");
		if(!ffsh_field.value)
			return;

		if (window.RegExp) {
			var res = "";
			var query = "";
			var command = "";
			var myreg = new RegExp("^([a-z,0-9]+) *(.*)$");

			res = myreg.exec(ffsh_field.value);
			if (!res) {
				ffsh_command("help", null);
				return;
			}

			command = res[1].toLowerCase();

			while(res[2].charAt(0) == ' ') {
				res[2] = res[2].substr(1);
			}

			while(res[2].charAt(res[2].length - 1) == ' ') {
				res[2] = res[2].substring(0, res[2].length - 1);
			}

			if (window.encodeURIComponent)
				query = window.encodeURIComponent(res[2]);
			else
				query = escape(res[2]);

			ffsh_command (command, query);

		} else
			return;
	}

	if(event.keyCode == KeyEvent.DOM_VK_ESCAPE ) {
		setTimeout(ffsh_close, 0);
		event.preventDefault();
	}
}
