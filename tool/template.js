//songtianming 2019/9/19 19:00:59

function heredoc(fn) {
    return fn.toString().match(/\/\*\s*(^[\s\S]*?)\s*\*\//m)[1];
  };
  Use:
var g_templates = {
    kv_lua:heredoc(function(){/*           
    %k% = "%v%",
        */})
};

// %k% = %v%,

