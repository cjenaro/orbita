-- Orbita - Inertia.js-style SPA adapter for Foguete
-- Provides seamless integration between Lua backend and Preact frontend

local response = require("orbita.response")

local orbita = {}

-- Package version
orbita.VERSION = "0.0.1"

-- Default configuration
local DEFAULT_CONFIG = {
	root_template = "app",
	asset_version = nil,
	ssr = false,
	ssr_url = nil,
	app_js_path = "/js/app.js",  -- Default path for the main JS file
}

-- Global configuration
local config = {}
for k, v in pairs(DEFAULT_CONFIG) do
	config[k] = v
end

-- Configure Orbita
function orbita.configure(opts)
	opts = opts or {}
	for k, v in pairs(opts) do
		config[k] = v
	end
end

-- Get current configuration
function orbita.get_config()
	return config
end

-- Check if request is an Orbita request
function orbita.is_orbita_request(request)
	local headers = request.headers or {}
	return headers["X-Orbita"] == "true" or headers["x-orbita"] == "true"
end

-- Serialize Carga model to plain table
local function serialize_carga_model(model)
	if not model._attributes then
		return model
	end
	
	local serialized = {}
	
	-- Copy all attributes from _attributes
	for key, value in pairs(model._attributes) do
		serialized[key] = value
	end
	
	-- Add some useful metadata
	serialized._persisted = model._persisted
	
	return serialized
end

-- Check if a table is a Carga model
local function is_carga_model(obj)
	return type(obj) == "table" and obj._attributes and obj._model_class
end

-- Process lazy props before sending to frontend
local function process_lazy_props(props, visited, depth)
	visited = visited or {}
	depth = depth or 0
	
	-- Prevent infinite recursion and stack overflow
	if depth > 10 then
		return props
	end
	
	-- Check for circular references
	if visited[props] then
		return "[Circular Reference]"
	end
	
	-- Mark this table as visited
	visited[props] = true
	
	local processed = {}
	for key, value in pairs(props) do
		if type(value) == "table" and value.__orbita_lazy then
			-- Execute lazy callback
			processed[key] = value.callback()
		elseif type(value) == "table" then
			-- Handle Carga models specially
			if is_carga_model(value) then
				processed[key] = serialize_carga_model(value)
			-- Skip certain internal/meta tables that might cause issues
			elseif type(key) == "string" and (key:match("^_") or key == "class" or key == "__index") then
				-- Skip internal properties for non-Carga objects
				processed[key] = "[Internal Property]"
			else
				-- Recursively process nested tables with depth tracking
				processed[key] = process_lazy_props(value, visited, depth + 1)
			end
		else
			processed[key] = value
		end
	end
	
	-- Unmark this table to allow it to be processed again in different contexts
	visited[props] = nil
	
	return processed
end

-- Render Orbita response
function orbita.render(component, props, request)
	props = process_lazy_props(props or {})
	request = request or {}
	local page_data = {
		component = component,
		props = props,
		url = request.path or "/",
		version = config.asset_version,
	}
	if orbita.is_orbita_request(request) then
		-- Return JSON response for AJAX requests
		return response.json(page_data)
	else
		-- Return HTML response with embedded page data for initial page load
		return response.html(page_data, config.root_template, config)
	end
end

-- Create middleware for automatic Orbita handling
function orbita.middleware()
	return function(request, response_obj, next)
		-- Add orbita helper to request
		request.orbita = {
			render = function(component, props)
				return orbita.render(component, props, request)
			end,
			is_orbita = orbita.is_orbita_request(request),
			share = function(key, value)
				-- Share data across all Orbita responses
				request.orbita_shared = request.orbita_shared or {}
				if value ~= nil then
					request.orbita_shared[key] = value
				else
					return request.orbita_shared[key]
				end
			end,
		}
		return next()
	end
end

-- Helper function to add to BaseController
function orbita.extend_controller(BaseController)
	-- Add render_orbita method to BaseController
	function BaseController:render_orbita(component, props)
		props = props or {}
		-- Merge shared data
		if self.request.orbita_shared then
			for k, v in pairs(self.request.orbita_shared) do
				if props[k] == nil then
					props[k] = v
				end
			end
		end
		-- Add common data
		props.auth = props.auth or {
			user = self:current_user(),
		}
		props.flash = props.flash or self.flash_messages
		props.errors = props.errors or {}
		return orbita.render(component, props, self.request)
	end
	-- Add orbita_share method
	function BaseController:orbita_share(key, value)
		self.request.orbita_shared = self.request.orbita_shared or {}
		if value ~= nil then
			self.request.orbita_shared[key] = value
		else
			return self.request.orbita_shared[key]
		end
	end
	return BaseController
end

-- Asset versioning helpers
function orbita.set_asset_version(version)
	config.asset_version = version
end

function orbita.get_asset_version()
	return config.asset_version
end

-- Lazy evaluation helper for expensive props
function orbita.lazy(callback)
	return {
		__orbita_lazy = true,
		callback = callback,
	}
end



return orbita

