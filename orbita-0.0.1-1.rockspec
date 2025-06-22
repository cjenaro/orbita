package = "orbita"
version = "0.0.1-1"
source = {
   url = "git+https://github.com/foguete-dev/orbita.git",
   tag = "v0.0.1"
}
description = {
   summary = "Inertia.js-style SPA adapter for Foguete framework",
   detailed = [[
      Orbita provides seamless integration between Lua backend controllers
      and Preact frontend components, inspired by Inertia.js patterns.
      
      Features include client-side routing, AJAX request handling,
      history management, form submission, and progress indicators.
   ]],
   homepage = "https://github.com/foguete-dev/orbita",
   license = "MIT"
}
dependencies = {
   "lua >= 5.1",
   "dkjson"
}
build = {
   type = "builtin",
   modules = {
      ["orbita"] = "src/orbita.lua",
      ["orbita.response"] = "src/response.lua",
      ["orbita.middleware"] = "src/middleware.lua"
   }
}