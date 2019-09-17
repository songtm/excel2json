local config={
	init = {
		coins = 1000,
		exp = "",
		golds = "",
		character = "wizard",
	},
	buildings = {
		barrack = {color = "b\"l\"ue\"",width = 200,height = 200,},
		mine = {color = "yellow",width = 200,height = 100,},
		gas = {color = "red",width = 100,height = 100,},
		townhall = {color = "black",width = 200,height = 200,},
	},
	reqcoins = {
		barrack = {100,500,1000,1500,2000,2500,},
		mine = {100,500,1000,},
		gas = {100,500,1000,},
	},
	shop = {
		{name = "blade",price = 100,req_level = 1,category = "attack",desc = "Sword",},
		{name = "dagger",price = 200,req_level = 2,category = "attack",desc = "Dagger",},
		{name = "thorn_dagger",price = 300,req_level = 2,category = "attack",desc = "Thorn dagger",},
		{name = "mail",price = 100,req_level = 2,category = "wear",desc = "Mail",},
	},
	inventory = {
		{type = "blade",attrib = "",},
		{type = "thorn_dagger",attrib = {a = 1,},},
		{type = "mail",attrib = "",},
		{type = "旬是什么",attrib = "",},
	},
	friends = {
		michael = {"tobby","cory","cain",},
		tobby = {"michael","cory",},
		tony = {"sarah","john",},
		gump = {},
	},
}
return config