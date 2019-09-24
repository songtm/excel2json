'songtianming 2019/9/19 19:00:59 

Public Function toStr(str As String)
    str = Replace(str, """", "\""")
    toStr = Chr(34) & str & Chr(34)
End Function

Private Function checkStr(str As Variant)
    Dim res As String
    
    If IsNumeric(str) Then
        res = CStr(str)
    Else
        res = CStr(str)
        If (Left(res, 1) = "[" And Right(res, 1) = "]") Or (Left(res, 1) = "{" And Right(res, 1) = "}") Or res = "false" Or res = "true" Then
        Else
            res = toStr(res)
        End If
    End If
    checkStr = res
End Function

Public Function printf(mask As String, ParamArray tokens()) As String
    Dim i As Long
    For i = 0 To UBound(tokens)
        mask = Replace$(mask, "{" & i & "}", tokens(i))
    Next
    printf = mask
End Function

Private Function EndsWith(str As String, ending As String) As Boolean
     Dim endingLen As Integer
     endingLen = Len(ending)
     EndsWith = (Right(Trim(UCase(str)), endingLen) = UCase(ending))
End Function

Private Function StartsWith(str As String, start As String) As Boolean
     Dim startLen As Integer
     startLen = Len(start)
     StartsWith = (Left(Trim(UCase(str)), startLen) = UCase(start))
End Function

Function RemoveLastChar(str As String, lastChar As String)
    If Len(str) <> 0 Then
        If Right$(str, 1) = lastChar Then str = Left$(str, Len(str) - 1)
    End If
    RemoveLastChar = str
End Function

Public Function toArray(ParamArray tokens())
    Dim x
    x = tokens
    toArray = toArrayOrTuple("[", "]", x)
End Function

Public Function toTuple(ParamArray tokens())
    Dim x
    x = tokens
    toTuple = toArrayOrTuple("{", "}", x)
End Function

Private Function toArrayOrTuple(prefix As String, suffix As String, tokens)
    Dim i As Long, str As String
    str = prefix
    Dim items, item
    For Each items In tokens
        If TypeOf items Is Object  Then
            For Each item In items
                If item <> "" Then
                    str = str + checkStr(item) + ","
                End If
            Next
        Else
            If items <> "" Then
                str = str + checkStr(items) + ","
            End If
        End If
        
    Next
    toArrayOrTuple = RemoveLastChar(str, ",") + suffix
End Function

'// [{1001, 2}, {2001, 3}, {3001, 4}] ;if tupleMemNum = 1 then => [{1,xx},{2,xxx}]
Public Function toArrayOfTuple(tupleMemNum As Integer, ParamArray tokens())
    Dim items, item
    Dim cout As Integer, tupleIndex As Integer
    tupleIndex = 1
    cout = 0
    Dim arrStr As String, tupleStr As String
    arrStr = "["
    tupleStr = "{"
    For Each items In tokens
        For Each item In items
            If item <> "" Then
                If tupleMemNum = 1 Then
                    tupleStr = tupleStr + checkStr(tupleIndex) + ","
                End If
                tupleStr = tupleStr + checkStr(item) + ","
                cout = cout + 1
                If cout >= tupleMemNum Then
                    tupleIndex = tupleIndex + 1
                    tupleStr = RemoveLastChar(tupleStr, ",") + "}"
                    arrStr = arrStr + tupleStr + ","
                    tupleStr = "{"
                    cout = 0
                End If
            End If
        Next
    Next
    toArrayOfTuple = RemoveLastChar(arrStr, ",") + "]"
End Function

Private Function toMapHelper(prefix As String, suffix As String, eqStr As String, keyNum As Integer, tokens)
    Dim keys() As String
    ReDim keys(keyNum)
    Dim cout As Integer, col As Integer
    Count = 0
    Dim resStr As String
    resStr = prefix
    For Each items In tokens
        For Each item In items
            col = col + 1
            If item <> "" Then
                'Debug.Print (item)
                Count = Count + 1
                If Count <= keyNum Then
                    keys(Count) = CStr(item)
                Else
                    resStr = resStr + keys(col - keyNum) + eqStr + checkStr(item) + ","
                End If
            End If
        Next
    Next
    toMapHelper = RemoveLastChar(resStr, ",") + suffix
End Function

Public Function toErlangMap(keyNum As Integer, ParamArray tokens())
    Dim x
    x = tokens
    toErlangMap = toMapHelper("#{", "}", " => ", keyNum, x)
End Function

Public Function toLuaMap(keyNum As Integer, ParamArray tokens())
    Dim x
    x = tokens
    toLuaMap = toMapHelper("{", "}", " = ", keyNum, x)
End Function











