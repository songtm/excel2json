// modified by songtianming:2019/9/12; excel的读取部分保留https://github.com/coolengineer/excel2json,tag语义已做大幅修改!
// 复杂的数据结构用框架下面的SAddin在excel中快速实现! 由于json的限制,不支持erlang中的tuple语义,只支持变长数组!

// 2019/9/12 "WSCRIPT.EXE" "D:\Proj\excel2json\tool\Excel2Json.js" "%1" "lua"  //lua erlang json
// 2019/9/09 #__{{}}会忽略其它table
// 2019/9/10 #xx{{}}没有$key时会自动转为#xx[{}]
// 2019/9/13 csx标记: chapter_id#c, chapter_id#s, chapter_id#x表示不导出， chapter_id#j表示json表达式
// 2019/9/18 #__xxx{{}}, 双下划线开头的提层级处理 todo
// 2019/9/18 table打#c(client only) #s（server only）支持  #__{{}}#c
// 2019/9/19 简化常见需求： table第一列 直接打个#就可以了
// 2019/9/21 初步支持json -> erlang
// 2019/9/21 支持数组 names[],  names[1], names[2]... todo check this

/*****

Excel2JSON, Excel - JSON Builder v1.0

You may use/distribute freely under the A-CUP-OF-BEER license.

*English*

Copyright (c) 2013, Hojin Choi <hojin.choi@gmail.com>
All rights reserved.

Redistribution and use in source and binary forms, with or
without modification, are permitted provided that
the following conditions are met:

Conditions:
1. Redistributions of source code must retain the above
copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
this list of conditions and the following disclaimer in the documentation
and/or other materials provided with the distribution.
3. Offering A CUP OF BEER with braveness for expressing "thank you"
for using/redistributing of source code or binary form to copyright holder
must be remembered. In spite of this condition, the copyright holder can
say 'no thank you' for expressing to decline the beer.

DISCLAIMER:
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS
AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS
BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
THE POSSIBILITY OF SUCH DAMAGE.


다음의 조건들을 충족시키는 한, 소스형식과 바이너리형식을 통한
재배포와 사용은 수정여부에 관계없이 허용된다.

조건들
1. 소스코드의 재배포는 위의 저작권표시와 여기 나열된 조건들,
그리고 아래의 보증부인 고지를 포함해야 한다.
2. 바이너리형식으로 재배포할때는 위의 저작권표시와 여기 나열된
조건들 그리고 아래의 보증부인고지를 배포할 때 제공되는 문서
및 기타자료에 포함해야 한다.
3. 재배포 혹은 사용에 대한 "고맙습니다"의 표시로써, 저작권자에게
용기내어 맥주 한 잔을 대접해야겠다는 것은 언제든지 기억해야한다.
그러나 이 조건에도 불구하고 저작권자는 거절의 표시로 "됐습니다"라고
말할 수 있다.

보증부인 고지사항
저작권자와 기여자는 이 소프트웨어를 “있는 그대로의” 상태로
제공하며, 상품성 여부나 특정한 목적에 대한 적합성에 대한 묵시적
보증을 포함한 어떠한 형태의 보증도 명시적이나 묵시적으로
제공되지 않는다.  손해 가능성을 사전에 알고 있었다 하더라도,
저작권자나 기여자는 어떠한 경우에도 이 소프트웨어의 사용으로
인하여 발생한, 직접적이거나 간접적인 손해, 우발적이거나 결과적
손해, 특수하거나 일반적인 손해에 대하여, 그 발생의 원인이나
책임론, 계약이나 무과실책임이나 불법행위(과실 등을 포함)와
관계 없이 책임을 지지 않는다. 이러한 조건은 대체 재화나 용역의
구입 및 유용성이나 데이터, 이익의 손실, 그리고 영업 방해 등을
포함하나 이에 국한되지는 않는다.

*****/

/* NOTICE
 * IF YOUR BEFORE JOB IS NOT CLEANLY DONE, DO THIS AT CMD LINE
 * 	taskkill /f /im wscript.exe
 * CLOSE ALL EXCEL JOBS
 */

// Global Stubs for Active-X
var W = WScript;
var S = WScript.CreateObject("WScript.Shell");
var F = WScript.CreateObject("Scripting.FileSystemObject");
var E = WScript.CreateObject("Excel.Application");

// Turn off excel alert
E.DisplayAlerts = false;
E.Visible = false;

var g_upgradeKey = "__";
var g_scriptFolder = W.ScriptFullName.replace(W.ScriptName, "");
var g_logFd = null;
var g_enableLog = true;
var g_popupMsg = "";
var g_localConfig = g_scriptFolder + "Excel2Json.config.js";

// Default Configuration
// DO NOT CHANGE THIS VALUE, MAKE Excel2Json.config.js FILE AND COPY THESE LINES AND EDIT THEM!!
var g_sourceFolder = g_scriptFolder; //excel source folder
var g_sourceFolderName = "excel_root";
var g_targetFolder = "output"; // subdirectory in g_sourceFolder
var g_exportType = "lua";// 导出类型 lua,json, erlang
var g_tempSuffix = ".$$$";
var g_prettyOutput = true; // false for compact

if (F.FileExists(g_localConfig)) {
	var fd = F.OpenTextFile(g_localConfig, 1, false, 0);
	var content = fd.ReadAll();
	fd.Close();
	eval(content);
}
var tempalteFile = g_scriptFolder + "template.js";
var g_templates = {};
if (F.FileExists(tempalteFile)) {
	var fd = F.OpenTextFile(tempalteFile, 1, false, 0);
	var content = fd.ReadAll();
	fd.Close();
	eval(content);
}

// Parsing context
var scanning = {
	file: "",
	row: 0,
	col: 0
};

/* Code snippet from json.org */

/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html
*/
// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
	JSON = {};
}

(function () {
	'use strict';

	function f(n) {
		// Format integers to have at least two digits.
		return n < 10 ? '0' + n : n;
	}

	if (typeof Date.prototype.toJSON !== 'function') {

		Date.prototype.toJSON = function (key) {

			return isFinite(this.valueOf())
				? this.getUTCFullYear() + '-' +
				f(this.getUTCMonth() + 1) + '-' +
				f(this.getUTCDate()) + 'T' +
				f(this.getUTCHours()) + ':' +
				f(this.getUTCMinutes()) + ':' +
				f(this.getUTCSeconds()) + 'Z'
				: null;
		};

		String.prototype.toJSON =
			Number.prototype.toJSON =
			Boolean.prototype.toJSON = function (key) {
				return this.valueOf();
			};
	}

	var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		gap,
		indent,
		meta = {    // table of character substitutions
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"': '\\"',
			'\\': '\\\\'
		},
		rep;


	function quote(string) {

		// If the string contains no control characters, no quote characters, and no
		// backslash characters, then we can safely slap some quotes around it.
		// Otherwise we must also replace the offending characters with safe escape
		// sequences.

		escapable.lastIndex = 0;
		return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
			var c = meta[a];
			return typeof c === 'string'
				? c
				: '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
		}) + '"' : '"' + string + '"';
	}


	function str(key, holder) {

		// Produce a string from holder[key].

		var i,          // The loop counter.
			k,          // The member key.
			v,          // The member value.
			length,
			mind = gap,
			partial,
			value = holder[key];

		// If the value has a toJSON method, call it to obtain a replacement value.

		if (value && typeof value === 'object' &&
			typeof value.toJSON === 'function') {
			value = value.toJSON(key);
		}

		// If we were called with a replacer function, then call the replacer to
		// obtain a replacement value.

		if (typeof rep === 'function') {
			value = rep.call(holder, key, value);
		}

		// What happens next depends on the value's type.

		switch (typeof value) {
			case 'string':
				return quote(value);

			case 'number':

				// JSON numbers must be finite. Encode non-finite numbers as null.

				return isFinite(value) ? String(value) : 'null';

			case 'boolean':
			case 'null':

				// If the value is a boolean or null, convert it to a string. Note:
				// typeof null does not produce 'null'. The case is included here in
				// the remote chance that this gets fixed someday.

				return String(value);

			// If the type is 'object', we might be dealing with an object or an array or
			// null.

			case 'object':

				// Due to a specification blunder in ECMAScript, typeof null is 'object',
				// so watch out for that case.

				if (!value) {
					return 'null';
				}

				// Make an array to hold the partial results of stringifying this object value.

				gap += indent;
				partial = [];

				// Is the value an array?

				if (Object.prototype.toString.apply(value) === '[object Array]') {

					// The value is an array. Stringify every element. Use null as a placeholder
					// for non-JSON values.

					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}

					// Join all of the elements together, separated with commas, and wrap them in
					// brackets.

					v = partial.length === 0
						? '[]'
						: gap
							? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
							: '[' + partial.join(',') + ']';
					gap = mind;
					return v;
				}

				// If the replacer is an array, use it to select the members to be stringified.

				if (rep && typeof rep === 'object') {
					length = rep.length;
					for (i = 0; i < length; i += 1) {
						if (typeof rep[i] === 'string') {
							k = rep[i];
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				} else {

					// Otherwise, iterate through all of the keys in the object.

					for (k in value) {
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}

				// Join all of the member texts together, separated with commas,
				// and wrap them in braces.

				v = partial.length === 0
					? '{}'
					: gap
						? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
						: '{' + partial.join(',') + '}';
				gap = mind;
				return v;
		}
	}

	// If the JSON object does not yet have a stringify method, give it one.

	if (typeof JSON.stringify !== 'function') {
		JSON.stringify = function (value, replacer, space) {

			// The stringify method takes a value and an optional replacer, and an optional
			// space parameter, and returns a JSON text. The replacer can be a function
			// that can replace values, or an array of strings that will select the keys.
			// A default replacer method can be provided. Use of the space parameter can
			// produce text that is more easily readable.

			var i;
			gap = '';
			indent = g_prettyOutput ? '\t' : '';

			// If the space parameter is a number, make an indent string containing that
			// many spaces.

			if (typeof space === 'number') {
				for (i = 0; i < space; i += 1) {
					indent += ' ';
				}

				// If the space parameter is a string, it will be used as the indent string.

			} else if (typeof space === 'string') {
				indent = space;
			}

			// If there is a replacer, it must be a function or an array.
			// Otherwise, throw an error.

			rep = replacer;
			if (replacer && typeof replacer !== 'function' &&
				(typeof replacer !== 'object' ||
					typeof replacer.length !== 'number')) {
				throw new Error('JSON.stringify');
			}

			// Make a fake root object containing our value under the key of ''.
			// Return the result of stringifying the value.

			return str('', { '': value });
		};
	}


	// If the JSON object does not yet have a parse method, give it one.

	if (typeof JSON.parse !== 'function') {
		JSON.parse = function (text, reviver) {

			// The parse method takes a text and an optional reviver function, and returns
			// a JavaScript value if the text is a valid JSON text.

			var j;

			function walk(holder, key) {

				// The walk method is used to recursively walk the resulting structure so
				// that modifications can be made.

				var k, v, value = holder[key];
				if (value && typeof value === 'object') {
					for (k in value) {
						if (Object.prototype.hasOwnProperty.call(value, k)) {
							v = walk(value, k);
							if (v !== undefined) {
								value[k] = v;
							} else {
								delete value[k];
							}
						}
					}
				}
				return reviver.call(holder, key, value);
			}


			// Parsing happens in four stages. In the first stage, we replace certain
			// Unicode characters with escape sequences. JavaScript handles many characters
			// incorrectly, either silently deleting them, or treating them as line endings.

			text = String(text);
			cx.lastIndex = 0;
			if (cx.test(text)) {
				text = text.replace(cx, function (a) {
					return '\\u' +
						('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				});
			}

			// In the second stage, we run the text against regular expressions that look
			// for non-JSON patterns. We are especially concerned with '()' and 'new'
			// because they can cause invocation, and '=' because it can cause mutation.
			// But just to be safe, we want to reject all unexpected forms.

			// We split the second stage into 4 regexp operations in order to work around
			// crippling inefficiencies in IE's and Safari's regexp engines. First we
			// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
			// replace all simple value tokens with ']' characters. Third, we delete all
			// open brackets that follow a colon or comma or that begin the text. Finally,
			// we look to see that the remaining characters are only whitespace or ']' or
			// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

			if (/^[\],:{}\s]*$/
				.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
					.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
					.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

				// In the third stage we use the eval function to compile the text into a
				// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
				// in JavaScript: it can begin a block or an object literal. We wrap the text
				// in parens to eliminate the ambiguity.

				j = eval('(' + text + ')');

				// In the optional fourth stage, we recursively walk the new structure, passing
				// each name/value pair to a reviver function for possible transformation.

				return typeof reviver === 'function'
					? walk({ '': j }, '')
					: j;
			}

			// If the text is not JSON parseable, then a SyntaxError is thrown.

			throw new SyntaxError('JSON.parse');
		};
	}
}());

/*
 * NOW Excel2Json Body
 */


String.prototype.endsWith = function (suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function setScanningFile(csvFile) {
	csvFile = csvFile.replace(g_sourceFolder, "");
	var sheetName = csvFile;
	var idx = csvFile.indexOf(g_tempSuffix);
	sheetName = sheetName.substring(idx + g_tempSuffix.length + 1).replace(".csv", "");
	scanning.file = csvFile.substring(0, idx) + "(" + sheetName + ")";
}

function logn(str) {
	if (!g_enableLog) return;
	//str = String(str).replace("\r\n", "\n").replace("\n", "\r\n");
	if (g_logFd == null) {
		g_logFd = F.OpenTextFile(g_targetFolder + "ExcelJson.log", 2, true, 0); // 2: write,  8: append mode
	}
	if (g_logFd) {
		g_logFd.Write(str);
	}
}

function log(str) {
	logn(str + "\r\n");
}

//log( "Working directory: " + g_sourceFolder );

function getLoc(withoutColumnInfo) {
	if (withoutColumnInfo == undefined) {
		return "ROW " + (scanning.row);
	}
	return String.fromCharCode('A'.charCodeAt(0) + scanning.col) + (scanning.row);
}

function parseLog(str, withoutColumnInfo) {
	var _msg;
	_msg = "[" + scanning.file + ": " + getLoc(withoutColumnInfo) + "]\r\n";
	_msg += str + "\r\n";
	logn(_msg);
	return _msg;
}

function popup(str, withoutColumnInfo, withoutScanningInfo) {
	if (withoutScanningInfo == undefined || withoutScanningInfo == false) {
		var _msg = parseLog(str, withoutColumnInfo);
		_msg += "--\r\n";
	} else {
		var _msg = str + "\r\n";
	}
	g_popupMsg += _msg;
}

function saveToFile(excelFile, jsonString, fileExt) {
	var jsonFileName = String(excelFile).replace(g_sourceFolder, "").replace(".xlsx", "").replace(".xls", "") + fileExt;
	var jsonPath = g_targetFolder + jsonFileName;

	if (!F.FolderExists(g_targetFolder)) {
		F.CreateFolder(g_targetFolder);
	}

	//http://msdn.microsoft.com/en-us/library/windows/desktop/ms677486(v=vs.85).aspx
	var A1 = WScript.CreateObject("ADODB.Stream");
	A1.Charset = "utf-8"
	A1.Mode = 3; // adModeReadWrite;
	A1.Type = 2; // adTypeText;
	A1.Open();

	var A2 = WScript.CreateObject("ADODB.Stream");
	A2.Mode = 3; // adModeReadWrite
	A2.Type = 1; // adTypeBinary
	A2.Open();

	A1.WriteText(jsonString, 0 /* adWriteChar */);
	A1.Position = 3; // Skip BOM
	A1.CopyTo(A2);
	A2.SaveToFile(jsonPath, 2 /* adSaveCreateOverWrite */);
	A2.Close();

	popup("Output: " + jsonPath, false, true);
}

function isExcel(filename) {
	if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
		return true;
	}
	return false;
}

function getExcelFiles(dir) {
	var sourceDirectory = F.GetFolder(dir);
	var files = new Enumerator(sourceDirectory.files);
	var excels = [];
	var msg = "";
	for (; !files.atEnd(); files.moveNext()) {
		var file = files.item();
		if (file.Name.substr(0, 1) == "~") {
			continue;
		}
		if (isExcel(file.Path)) {
			excels.push(String(file.Path));
		}
	}
	return excels;
}

function deleteTemp(tmpdir) {
	//For safety!
	if (!tmpdir.endsWith(g_tempSuffix)) {
		return;
	}

	//Just skip non-existent folder.
	if (!F.FolderExists(tmpdir)) {
		return;
	}

	//Let's do it!
	F.DeleteFolder(tmpdir, true);
}

function deleteTempFiles(dir) {
	var sourceDirectory = F.GetFolder(dir);
	var files = new Enumerator(sourceDirectory.files);
	var excels = [];
	var msg = "";
	for (; !files.atEnd(); files.moveNext()) {
		var file = files.item();
		if (file.Name.endsWith(".Identifier")) {
			F.DeleteFile(file.Name);
		}
	}
}


function assertTraillingOneSlash(path) {
	while (path.endsWith("\\")) {
		path = path.substr(0, path.length - 1);
	}
	path += "\\";
	return path;
}

function saveAsCSV(sheet, tmpdir) {
	if (!F.FolderExists(tmpdir)) {
		F.CreateFolder(tmpdir);
	}
	var csvFile = tmpdir + "\\" + sheet.Name + ".csv";

	// http://msdn.microsoft.com/en-us/library/office/ff198017.aspx
	// XlFileFormat Enumeration Table: CSV (6)
	sheet.SaveAs(csvFile, 6);
	return csvFile;
}

function readCSVLine(csvLine)//return array：$value[] ...
{
	var values = [];
	var value = null;
	var inQuote = false;
	csvLine = String(csvLine);
	// log("-----"+csvLine)
	for (var i = 0; i < csvLine.length; i++) {
		var ch = csvLine.charAt(i);
		var chNext = '';
		if (i < csvLine.length - 1) {
			chNext = csvLine.charAt(i + 1);
		}
		if (!inQuote) {
			switch (ch) {
				case ',':
					// log("  "+value + getPrettyValue(value))
					values.push(getPrettyValue(value));
					value = "";
					break;
				case '"':
					inQuote = true;
					break;
				default:
					value = (value || "") + ch;
			}
		} else {
			switch (ch) {
				case '"':
					if (chNext == '"') {
						value += '"';
						i++;
					} else {
						inQuote = false;
					}
					break;
				default:
					value = (value || "") + ch;
			}
		}
	}
	if (value != null) {
		values.push(getPrettyValue(value));
	}
	return values;
}

function readCSVFile(csvFile) {
	//http://msdn.microsoft.com/en-us/library/314cz14s(v=vs.84).aspx
	//ForReading (1), no-create(false), unicode(-1)
	var sheet = [];
	sheet.push(csvFile);
	log("Parsing: " + csvFile);
	var fd = F.OpenTextFile(csvFile, 1, false, 0);
	while (!fd.AtEndOfStream) {
		var line = fd.ReadLine();
		//log( "Read: " + line );
		var values = readCSVLine(line);
		//log( JSON.stringify( values ) );
		sheet.push(values);
	}
	fd.Close();
	return sheet;
}

function processArrayCols(keyIndex, keyTag, key, sheet, row) {
	var res = [];
	var count = 1
	while (true) {
		var curKey = key+"["+count + "]"
		var curCol = keyIndex[curKey];
		if (curCol != undefined && sheet[row][curCol] != undefined && sheet[row][curCol]){
			res.push(getPrettyValue(sheet[row][curCol], keyTag[curKey], row, curCol));
		}
		else {
			break;
		}
		count++;
	}
	var arrayKey = key+"[]"
	if (keyIndex[arrayKey]) {
		var arrayRes = readCSVLine(sheet[row][keyIndex[arrayKey]]);
		return arrayRes.concat(res);
	}
	return res;
}

function compileSimpleTable(sheet, row, keyIndex, keyTag) {
	var keyCol = keyIndex["$key"];
	var isArrayValue = false;
	var value = {};
	log("Parsing Simple Table...");
	if (keyCol == undefined) {
		popup("$key COLUMN NOT FOUND");
		return null;
	}

	var valCol = keyIndex["$value"];
	if (valCol == undefined) {
		valCol = keyIndex["$value[]"] || keyIndex["$value[1]"];
		isArrayValue = true;
	} else {
		if (keyIndex["$value[]"] != undefined) {
			popup("$value, $value[] BOTH FOUND, DELETE ONE PLEASE");
			return null;
		}
	}
	if (valCol == undefined) {
		popup("$value or $value[] or $value[1] COLUMN NOT FOUND");
		return null;
	}

	log("Using key index: " + keyCol + " value index: " + valCol);
	while (sheet[row] != undefined && sheet[row][keyCol] != undefined && sheet[row][keyCol]) {
		if (isArrayValue) {
			value[sheet[row][keyCol]] = processArrayCols(keyIndex, keyTag, "$value", sheet, row);
		} else {
			value[sheet[row][keyCol]] = getPrettyValue(sheet[row][valCol], keyTag["$value"], row, valCol);
		}
		row++;
	}
	return value;
}

function compileObjectObjectTable(sheet, row, keyIndex, keyTag) {
	var keyCol = keyIndex["$key"];
	var isArrayValue = false;
	var value = {};
	log("Parsing Object Object Table...");
	if (keyCol == undefined) {
		log("$key COLUMN NOT FOUND and change to [{}]");
		return compileArrayObjectTable(sheet, row, keyIndex, keyTag);
		// return null;
	}
	log("Using key index: " + keyCol);
	while (sheet[row] != undefined && sheet[row][keyCol] != undefined && sheet[row][keyCol]) {
		var obj = {};

		for (subkey in keyIndex) {
			if (subkey == "$key") continue;
			var valCol = keyIndex[subkey];
			if (subkey.endsWith("]")) {
				subkey = subkey.substr(0, subkey.indexOf("["));
				if (!obj[subkey]) {
					obj[subkey] = processArrayCols(keyIndex, keyTag, subkey, sheet, row);
				}
			} else {
				obj[subkey] = getPrettyValue(sheet[row][valCol], keyTag[subkey], row, valCol);
			}
		}
		value[sheet[row][keyCol]] = obj;
		row++;
	}
	return value;
}

function compileArrayObjectTable(sheet, row, keyIndex, keyTag) {
	var value = [];
	log("Parsing Array Object Table...");
	while (sheet[row] != undefined) {
		var obj = {};
		var isSane = false;
		for (subkey in keyIndex) {
			var valCol = keyIndex[subkey];
			if (subkey.endsWith("]")) {
				subkey = subkey.substr(0, subkey.indexOf("["));
				if (!obj[subkey]) {
					obj[subkey] = processArrayCols(keyIndex, keyTag, subkey, sheet, row);
					if (obj[subkey].length > 0) {
						isSane = true;
					}
				}
			} else {				
				obj[subkey] = getPrettyValue(sheet[row][valCol], keyTag[subkey], row, valCol);
				if (obj[subkey]) {
					isSane = true;
				}
			}
		}
		if (!isSane) {
			break;
		}
		value.push(obj);
		row++;
	}
	return value;
}

function compileObjectArrayTable(sheet, row, keyIndex, keyTag) {
	var value = {};
	log("Parsing Object Array Table...");
	for (subkey in keyIndex) {
		var valCol = keyIndex[subkey];
		var isArray = false;
		if (subkey.endsWith("[]")) {
			isArray = true;
		}
		var obj = [];
		var r = row;
		var v;
		while (sheet[r] instanceof Array && (v = String(sheet[r][valCol])) != "") {
			// log("xxx "+sheet[r][valCol])
			if (isArray) {
				subkey = subkey.substr(0, subkey.length - 2);
				obj.push(readCSVLine(v));
			} else {
				obj.push(getPrettyValue(v, keyTag[subkey], r, valCol));
			}
			r++;
		}
		value[subkey] = obj;
	}
	return value;
}


function compileSheet(sheet, rootObject) {
	var csvFile = sheet[0];
	setScanningFile(csvFile);
	for (var row = 1; row < sheet.length; row++) //each row of a sheet
	{
		//try {
		var line = sheet[row];
		if (line == undefined) {
			continue;
		}

		var anchor = line[0]; //sheet row:  [item1, item2, item3...]
		if (anchor == null) {
			continue;
		}

		anchor = String(anchor);
		if (anchor.charAt(0) != '#') {
			continue;
		}
		if (anchor.endsWith("#c") && g_exportType == "erlang") //client only
		{
			continue;
		}
		if (anchor.endsWith("#s") && g_exportType == "lua") //server only
		{
			continue;
		}
		if (anchor.endsWith("#c") || anchor.endsWith("#s"))
			anchor = anchor.substring(0, anchor.length - 2);
		scanning.row = row;

		var objectName = "";
		var objectType = "";
		var keyIndex = {};
		var keyTag = {};
		if (anchor == "#") {
			objectName = g_upgradeKey + csvFile.replace(/^.*[\\\/]/, '') + row;
			objectType = "";
		} else {
			objectName = String(/#\w+/.exec(anchor));
			objectType = anchor.substring(objectName.length);
			objectName = objectName.substring(1);
		}
		log("------------------------------------------------------------------------------");
		parseLog("Found object mark: '" + anchor + "'");

		for (var col = 1; col < line.length; col++) {
			scanning.col = col;
			var key = line[col];
			if (key.length > 0) {
				var tagIndex = key.indexOf("#");//key tag #c  #s #j
				var tag = "";
				if (tagIndex >= 0) {
					tag = key.substring(tagIndex);
					key = key.substring(0, tagIndex);
					keyTag[key] = tag;
				}
				var ignore = false;
				if (tag.indexOf("x") >= 0) ignore = true;
				if (tag.indexOf("c") >= 0 && g_exportType == "erlang") { //client only
					ignore = true;
				}
				else if (tag.indexOf("s") >= 0 && g_exportType == "lua") { //server only
					ignore = true;
				}
				if (!ignore)
					keyIndex[key] = col;
				parseLog(" Key: " + key + " at col" + col + " tag:" + tag + " ingore:" + ignore);
			}
		}
		var compiler = null;
		switch (objectType) {
			case "{}": compiler = compileSimpleTable; break;
			case "{{}}": compiler = compileObjectObjectTable; break;
			case "{[]}": compiler = compileObjectArrayTable; break;
			case "[{}]": compiler = compileArrayObjectTable; break;
			case "": compiler = getCompiler(objectName, keyIndex); break
			default:
				popup("Invalid object type marker: " + anchor);
		}
		if (compiler) {
			var value = compiler.call(null, sheet, row + 1, keyIndex, keyTag, objectName);
			if (value) {
				if (compiler == compileWithSchema) {
					var oname = g_upgradeKey + csvFile.replace(/^.*[\\\/]/, '') + row;
					rootObject[oname] = value;
				} else {
					rootObject[objectName] = value;
				}
			}
		}
		//} catch(e) {
		//	popup("Exception: " + e);
		//}
	}
}
function compileWithSchema(sheet, row, keyIndex, keyTag, objectName) {
	var templateName = objectName + "_" + g_exportType;
	var line = g_templates[templateName];
	var prefixholder = ""
	if (line.indexOf("<--") >= 0) {
		var match = line.match(/<--([\s\S]*)-->/m);
		prefixholder = match[0];
		line = prefixholder.replace("<--", "   ").replace("-->", "   ");
	}
	// log(line);
	var holders = line.match(/%\w+[\,]?%/g);
	var cellKeys = [];
	var cellVals = [];
	var sperators = [];
	var res = "";
	for (var index = 0; index < holders.length; index++) {
		var holder = holders[index];
		cellVals.push("");
		if (holder[holder.length - 2] == ",") {
			sperators.push(",");
			cellKeys.push(holder.substring(1, holder.length - 2));
		}
		else {
			sperators.push("");
			cellKeys.push(holder.substring(1, holder.length - 1));
		}
	}
	// log("xxxxxxxxx"+holders.Array());
	// value = value.replace(new RegExp("\"", "gm"), "\\\"");//gm global mutiline
	while (sheet[row] != undefined) {
		var isSane = false;
		for (var index = 0; index < cellKeys.length; index++) {
			var cellKey = cellKeys[index];
			var col = keyIndex[cellKey];
			if (col) {
				var val = sheet[row][col]
				if (val) isSane = true;
				cellVals[index] = val;
			} else {
				var msg = "Error: can't find key [" + cellKey + "] for template:" + templateName;
				popup(msg);
				return;
			}
		}
		if (!isSane) {
			break;
		}
		var newLine = line;
		for (var index = 0; index < cellVals.length; index++) {
			newLine = newLine.replace(holders[index], cellVals[index]);
		}
		res += newLine + "\r\n";
		// log(newLine);
		row++;
	}
	if (prefixholder != "") {
		return g_templates[templateName].replace(prefixholder, res);
	}
	return res;
}
function getCompiler(objName, keyIndex) {
	// log(g_templates[objName+"_"+g_exportType])
	if (g_templates[objName + "_" + g_exportType]) {
		return compileWithSchema;
	}
	if (keyIndex["$key"]) {
		if (keyIndex["$value"] || keyIndex["$value[]"])
			return compileSimpleTable;
		return compileObjectObjectTable;
	} else {//array
		return compileArrayObjectTable;
	}
}
function compileSheetArray(sheetArray) {
	var rootObject = {};

	for (var i = 0; i < sheetArray.length; i++) {
		compileSheet(sheetArray[i], rootObject);
	}
	return rootObject;
}

function parseExcel(excelFile) {
	E.Workbooks.Open(excelFile, true, true);

	var tmpdir = excelFile + g_tempSuffix;
	var csvFiles = [];
	var sheetArray = [];
	deleteTemp(tmpdir);

	log("\r\nLoading: " + excelFile);

	try {
		for (var i = 1; i <= E.Worksheets.Count; i++) {
			var sheet = E.Worksheets.Item(i);
			log("Parse sheet: " + sheet.Name);
			if (sheet.Name.substr(0, 1) != '#') {
				log("Skipped, no '#' prefix detected");
				continue;
			}
			var csvFile = saveAsCSV(sheet, tmpdir);
			setScanningFile(csvFile);
			csvFiles.push(csvFile);
			sheetArray.push(readCSVFile(csvFile, sheetArray));
		}
	} catch (e) {
		popup("Error: " + e.message);
		E.Workbooks.Close();
		throw e;
	}
	E.Workbooks.Close();
	deleteTemp(tmpdir);
	log("Closing: " + excelFile);
	var rootObject = compileSheetArray(sheetArray);
	var simpled = rootObject[g_upgradeKey] == undefined ? rootObject : rootObject[g_upgradeKey]; //begin with _; then simple json structure
	return simpled;
}

function getPrettyValue(value, tag, row, col) {
	if (typeof (value) == "number") return value;
	if (value == null) return "";
	if (value == "") return "";
	if (typeof (value) == "string" && isFinite(value)) return Number(value);
	if (tag == undefined || tag.indexOf("j") == -1) {//normal string
		if (g_exportType == "lua" && value.substring(0, 1) == "[" && value.endsWith("]")) {
			return String(value).replace("[", "{").replace("]", "}");
		}
		return String(value);
	} else {//json str
		try {
			var o = JSON.parse(value);
			return o;
		} catch (e) {
			var msg = "Parse json string Error:\r\n" +
				"file:" + scanning.file + " row:" + row + 1 + " col:" + col + "\r\n" + value;
			e.message = msg;
			throw e;
		}
	}
}

function checkKey(k) {
	if (g_exportType == "erlang") return k;
	k = getPrettyValue(k);
	if (typeof (k) == "number") {
		return "[" + k + "]";
	}
	return k;
}

function checkValueStr(value) {
	if (typeof (value) == "string") {
		if (value == "TRUE" || value == "true") return "true";
		if (value == "FALSE" || value == "false") return "false";
		if (value.substring(0,1) == '"' && value.endsWith('"')) {
			return value;
		}
		if (value.substring(0,1) == '[' && value.endsWith(']')) return value;
		if (value.substring(0, 1) == '{' && value.endsWith('}')) return value;
	
		if (value.indexOf('"') >= 0) {
			value = value.replace(new RegExp("\"", "gm"), "\\\"");//gm global mutiline
		}
		return '"' + value + '"';
	}
	return value
}
function to_lua(indMaxLv, o, lines, stackLv, indStr, prtIsArr) {
	return "local config=" + exportHelper(indMaxLv, o, lines, stackLv, indStr, prtIsArr) + "\r\nreturn config"
}
function exportHelper(indMaxLv, o, lines, stackLv, indStr, prtIsArr) {
	var nl = stackLv <= indMaxLv ? "\r\n" : "";
	var nlAndIndent = stackLv <= indMaxLv ? "\r\n" + indStr + "\t" : "";
	var newIndent = stackLv <= indMaxLv ? indStr + "\t" : "";

	var line = (prtIsArr ? indStr : "") + "{";
	if (o instanceof Array) {//array
		for (var i in o) {
			var item = o[i];
			if (typeof (item) == "object") {
				line += nl + exportHelper(indMaxLv, item, lines, stackLv + 1, newIndent, true);
			}
			else {//basic element
				line += nlAndIndent + checkValueStr(item) + ", ";
			}
		};
	} else {//obj
		for (var k in o) {
			if (typeof (o[k]) == "object") {
				if (stackLv == 1 && typeof (k) == "string" && k.substring(0, 2) == g_upgradeKey) {//提层级
					var oo = o[k];
					for (var kk in oo) {//把子级的数据拉到父级来直接处理了！
						if (typeof (oo[kk]) == "object") {//包含数组;数组的key为[1]
							line += nlAndIndent + checkKey(kk) + " = " + exportHelper(indMaxLv, oo[kk], lines, stackLv + 1, newIndent);
						} else {
							line += nlAndIndent + checkKey(kk) + " = " + checkValueStr(oo[kk]) + ", ";
						}
					}
				} else {
					line += nlAndIndent + checkKey(k) + " = " + exportHelper(indMaxLv, o[k], lines, stackLv + 1, newIndent);
				}

			}
			else//basic element
			{
				if (stackLv == 1 && typeof (k) == "string" && k.substring(0, 2) == g_upgradeKey) {//template schema
					line += nl + o[k];
				} else {
					line += nlAndIndent + checkKey(k) + " = " + checkValueStr(o[k]) + ", ";
				}
			}
		}
	}

	line += (nl == "" ? "" : nl + indStr) + "}" + (stackLv == 1 ? "" : ", ");
	return lines + line;
}

function to_erlang(indMaxLv, o, lines, stackLv, indStr, prtIsArr) {
	var nl = stackLv <= indMaxLv ? "\r\n" : "";
	var nlAndIndent = stackLv <= indMaxLv ? "\r\n" + indStr + "\t" : "";
	var newIndent = stackLv <= indMaxLv ? indStr + "\t" : "";
	var startMapStr = stackLv == 1 ? "#{" : ""
	var endMapSTr = stackLv == 1 ? "}." : ", "

	var startBracket = o instanceof Array ? "[" : "{"
	var endBracket = o instanceof Array ? "]" : "}"
	var line = stackLv != 1 ? ((prtIsArr ? indStr : "") + startBracket) : "";
	if (o instanceof Array) {//array
		for (var i in o) {
			var item = o[i];
			if (typeof (item) == "object") {
				line += nl + to_erlang(indMaxLv, item, lines, stackLv + 1, newIndent, true)+", ";
			}
			else {//basic element
				line += nlAndIndent + checkValueStr(item) + ", ";
			}
		};
		if (line.endsWith(", ")) line = line.substring(0, line.length - 2)

	} else {//obj
		for (var k in o) {
			if (typeof (o[k]) == "object") {
				if (stackLv == 1 && typeof (k) == "string" && k.substring(0, 2) == g_upgradeKey) {//提层级
					var oo = o[k];
					for (var kk in oo) {//把子级的数据拉到父级来直接处理了！
						if (typeof (oo[kk]) == "object") {//包含数组;数组的key为[1]
							line += nlAndIndent + startMapStr + checkKey(kk) + " => " + to_erlang(indMaxLv, oo[kk], lines, stackLv + 1, newIndent) + endMapSTr;
						} else {
							line += nlAndIndent + startMapStr + checkKey(kk) + " => " + checkValueStr(oo[kk]) + endMapSTr;
						}
					}
				} else {
					line += nlAndIndent + startMapStr + checkKey(k) + " => " + to_erlang(indMaxLv, o[k], lines, stackLv + 1, newIndent) + endMapSTr;
				}

			}
			else//basic element
			{
				if (stackLv == 1 && typeof (k) == "string" && k.substring(0, 2) == g_upgradeKey) {//template schema
					line += nl + o[k];
				} else {
					line += nlAndIndent + startMapStr + checkKey(k) + " => " + checkValueStr(o[k]) + endMapSTr;
				}
			}
		}
		if (line.endsWith(", ")) line = line.substring(0, line.length - 2)

	}
	if (stackLv == 1)
		line += "";
	else {
		line += (nl == "" ? "" : nl + indStr) + endBracket
	}

	return lines + line;
}
try {
	g_sourceFolder = assertTraillingOneSlash(g_sourceFolder);

	var excels = [];
	objArgs = WScript.Arguments;
	if (objArgs.length > 0) {
		for (i = 0; i < objArgs.length; i++) {
			if (isExcel(objArgs(i))) {
				if (objArgs(i).indexOf(g_sourceFolderName) >= 0) {
					g_sourceFolder = objArgs(i).substring(0, objArgs(i).indexOf(g_sourceFolderName));
					excels.push(objArgs(i));
				} else {
					W.Echo(objArgs[i] + ":file path not contain:" + g_sourceFolderName);
					E.Quit();
					W.Quit(0);
				}

			}
		}
		if (!isExcel(objArgs(objArgs.length - 1))) {
			g_exportType = objArgs(objArgs.length - 1);
		}
	}
	if (excels.length == 0) {
		W.Echo("There is no excel files in folder named\r\n" + g_sourceFolderName);
		E.Quit();
		W.Quit(0);
	}

	g_targetFolder = g_sourceFolder + g_targetFolder + "\\" + g_exportType + "\\";
	g_sourceFolder = g_sourceFolder + g_sourceFolderName + "\\";
	g_targetFolder = assertTraillingOneSlash(g_targetFolder);

	if (!F.FolderExists(g_targetFolder)) {
		F.CreateFolder(g_targetFolder);
	}

	// W.Echo(g_sourceFolder + "\r\n"+g_targetFolder);
	// E.Quit();
	// W.Quit(0);

	for (var i in excels) {
		var jsonObj = parseExcel(excels[i]);
		var str = "";
		var ext = ".json";
		if (g_exportType == "json") {
			str = JSON.stringify(jsonObj).split("\n").join("\r\n");
			ext = ".json";
		} else if (g_exportType == "lua") {
			// log(JSON.stringify(jsonObj).split("\n").join("\r\n"));
			var lines = [];
			var indentLv = jsonObj instanceof Array ? 1 : 2;
			str = to_lua(indentLv, jsonObj, "", 1, "", false);
			ext = ".lua";
		}
		else if (g_exportType == "erlang") {
			var lines = [];
			var indentLv = 1//jsonObj instanceof Array ? 1 : 2;
			str = to_erlang(indentLv, jsonObj, "", 1, "", false);;
			ext = ".config";
		}

		saveToFile(excels[i], str, ext);
	}
	deleteTempFiles(g_sourceFolder);

	if (g_popupMsg) {
		W.Echo(g_popupMsg);
	}
} catch (e) {
	E.Quit();
	W.Echo(e.message);
	throw e;
	W.Quit(1);
}
E.Quit();
W.Quit(0);

// End OF FILE
