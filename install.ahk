
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua, ,导出lua配置表
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua, Icon,%A_ScriptDir%\tool\luaIcon.exe

RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua\command, ,"D:\Proj\excel2json\tool\doExport.bat" "`%1" "lua"

; "WSCRIPT.EXE" "D:\Proj\excel2json\tool\Excel2Json.js" "%1" "output" "lua"