; songtianming:2019/9/18

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
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua, Icon,%A_ScriptDir%\install.exe
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2lua\command, ,"WSCRIPT.EXE" "%A_ScriptDir%\tool\Excel2Json.js" "`%1" "lua"


RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2erlang, ,导出erlang配置表
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2erlang, Icon,%A_ScriptDir%\install.exe
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\excel2erlang\command, ,"WSCRIPT.EXE" "%A_ScriptDir%\tool\Excel2Json.js" "`%1" "erlang"