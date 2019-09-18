full_command_line := DllCall("GetCommandLine", "str")

if not (A_IsAdmin or RegExMatch(full_command_line, " /restart(?!\S)"))
{
    try
    {
        if A_IsCompiled
            Run *RunAs "%A_ScriptFullPath%" /restart
        else
            Run *RunAs "%A_AhkPath%" /restart "%A_ScriptFullPath%"
    }
    ExitApp
}

RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua, ,导出lua配置表
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua, Icon,%A_ScriptDir%\tool\luaIcon.exe

RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua\command, ,"WSCRIPT.EXE %A_ScriptDir%\tool\Excel2Json.js" "`%1" output lua

; "WSCRIPT.EXE" "D:\Proj\excel2json\tool\Excel2Json.js" "%1" "output" "lua"