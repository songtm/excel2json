
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua, ,导出lua配置表
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua, Icon,%A_ScriptDir%\tool\luaIcon.exe

RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua\command, ,"WSCRIPT.EXE %A_ScriptDir%\tool\Excel2Json.js" "`%1" output lua
