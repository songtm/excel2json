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

; RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\Excel2lua, ,导出lua配置表
; RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\Excel2lua, Icon,%A_ScriptDir%\install.exe
; RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\Excel2lua\command, ,"WSCRIPT.EXE" "%A_ScriptDir%\tool\Excel2Json.js" "`%1" "lua"


; RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\Excel2erlang, ,导出erlang配置表
; RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\Excel2erlang, Icon,%A_ScriptDir%\install.exe
; RegWrite, REG_SZ, HKEY_CLASSES_ROOT\*\shell\Excel2erlang\command, ,"WSCRIPT.EXE" "%A_ScriptDir%\tool\Excel2Json.js" "`%1" "erlang"


RegRead, SheetVer, HKEY_CLASSES_ROOT\Excel.Sheet\CurVer
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2lua, ,导出lua配置表
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2lua, Icon,%A_ScriptDir%\install.exe
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2lua\command, ,"WSCRIPT.EXE" "%A_ScriptDir%\tool\Excel2Json.js" "`%1" "lua"

RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2erlang, ,导出erlang配置表
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2erlang, Icon,%A_ScriptDir%\install.exe
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2erlang\command, ,"WSCRIPT.EXE" "%A_ScriptDir%\tool\Excel2Json.js" "`%1" "erlang"

RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2json, ,导出json配置表
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2json, Icon,%A_ScriptDir%\install.exe
RegWrite, REG_SZ, HKEY_CLASSES_ROOT\%SheetVer%\shell\Excel2json\command, ,"WSCRIPT.EXE" "%A_ScriptDir%\tool\Excel2Json.js" "`%1" "json"


; C:\Users\songtianming\AppData\Roaming\Microsoft\AddIns\SAddin.xlam

FileCopy, %A_ScriptDir%\tool\SAddin.xlam, %A_AppData%\Microsoft\AddIns\, 1

TrayTip, Excel Addin安装完成, Excel file上右键试试看`n重启Excel以使自定义函数生效, 2