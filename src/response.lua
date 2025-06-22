-- Orbita Response Helpers
-- Handles JSON and HTML responses for Orbita

local json = require("dkjson")

local response = {}

-- Generate JSON response for AJAX requests
function response.json(page_data)
	return {
		status = 200,
		headers = {
			["Content-Type"] = "application/json; charset=utf-8",
			["X-Orbita"] = "true",
			["Vary"] = "Accept",
		},
		body = json.encode(page_data),
	}
end

-- Generate HTML response for initial page loads
function response.html(page_data, template)
	template = template or "app"
	local html_template = string.format(
		[[
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>%s</title>
    <script>
        window.__ORBITA_PAGE__ = %s;
    </script>
</head>
<body>
    <div id="app" data-page='%s'></div>
    <script src="/js/app.js"></script>
</body>
</html>
    ]],
		page_data.props.title or "Foguete App",
		json.encode(page_data),
		json.encode(page_data):gsub("'", "\\'")
	)

	return {
		status = 200,
		headers = {
			["Content-Type"] = "text/html; charset=utf-8",
			["X-Orbita"] = "false",
		},
		body = html_template,
	}
end

-- Handle validation errors (422 status)
function response.validation_errors(errors)
	return {
		status = 422,
		headers = {
			["Content-Type"] = "application/json; charset=utf-8",
			["X-Orbita"] = "true",
		},
		body = json.encode({
			message = "The given data was invalid.",
			errors = errors,
		}),
	}
end

-- Handle redirects for Orbita
function response.redirect(url, status)
	status = status or 302

	return {
		status = status,
		headers = {
			["Location"] = url,
			["X-Orbita-Location"] = url,
		},
		body = "",
	}
end

return response

