-- Orbita Middleware
-- Provides middleware functions for Orbita integration

local orbita = require("orbita")

local middleware = {}

-- Main Orbita middleware
function middleware.orbita()
	return orbita.middleware()
end

-- CSRF token validation with secure comparison
local function validate_csrf_token(token, session)
	if not session or not session.csrf_token or not token then
		return false
	end

	-- Constant-time string comparison to prevent timing attacks
	local session_token = session.csrf_token
	if #token ~= #session_token then
		return false
	end

	local result = 0
	for i = 1, #token do
		result = result | (string.byte(token, i) ~ string.byte(session_token, i))
	end

	return result == 0
end

-- Handle CSRF protection for Orbita requests
function middleware.csrf()
	return function(request, response, next)
		-- Skip CSRF for GET requests
		if request.method == "GET" then
			return next()
		end
		-- Check CSRF token for POST/PUT/PATCH/DELETE
		local token = request.headers["X-CSRF-Token"]
			or request.headers["x-csrf-token"]
			or (request.body and request.body._token)
		if not token or not validate_csrf_token(token, request.session) then
			if orbita.is_orbita_request(request) then
				return {
					status = 419,
					headers = { ["Content-Type"] = "application/json" },
					body = '{"message":"CSRF token mismatch"}',
				}
			else
				return {
					status = 419,
					headers = { ["Content-Type"] = "text/html" },
					body = "CSRF token mismatch",
				}
			end
		end
		return next()
	end
end

-- Generate cryptographically secure CSRF token
function middleware.generate_csrf_token()
	local chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	local token = {}

	-- Use os.time and math.random for entropy
	math.randomseed(os.time() + os.clock() * 1000000)

	for i = 1, 32 do
		local rand = math.random(1, #chars)
		token[i] = string.sub(chars, rand, rand)
	end

	return table.concat(token)
end

-- Middleware to add CSRF token to session
function middleware.csrf_token()
	return function(request, response, next)
		if not request.session then
			request.session = {}
		end

		if not request.session.csrf_token then
			request.session.csrf_token = middleware.generate_csrf_token()
		end

		return next()
	end
end

-- Handle file uploads for Orbita
function middleware.handle_uploads()
	return function(request, response, next)
		-- Process multipart/form-data uploads
		if request.headers["Content-Type"] and string.find(request.headers["Content-Type"], "multipart/form-data") then
			-- Initialize files table for multipart data
			request.files = request.files or {}
			-- Note: Full multipart parsing would require additional implementation
		end
		return next()
	end
end

-- Add security headers
function middleware.security_headers()
	return function(request, response, next)
		local result = next()
		if result and result.headers then
			result.headers["X-Content-Type-Options"] = "nosniff"
			result.headers["X-Frame-Options"] = "DENY"
			result.headers["X-XSS-Protection"] = "1; mode=block"
		end
		return result
	end
end

-- Handle partial reloads (only specific components)
function middleware.partial_reload()
	return function(request, response, next)
		local partial_component = request.headers["X-Orbita-Partial-Component"]
			or request.headers["x-orbita-partial-component"]
		if partial_component then
			request.orbita_partial = {}
			for component in string.gmatch(partial_component, "([^,]+)") do
				request.orbita_partial[component] = true
			end
		end
		return next()
	end
end

return middleware
