//websock stuffs
var wsAddress;
var wsSessionID;
function loadWebsocket() {
	var include = document.createElement("script");
	include.src = "conn/comms-websock.js";
	include.async = false;
	document.head.append(include);
}

function tryconn(constring) {
	if (connstring.includes("ws-")) {
		wsAddress = "ws://localhost/ws";//will need to replace this with the default websock address
		wsSessionID = constring;
		loadWebsocket();
	}
	$('#splash').hide();
}

function advcon(type) {
	wsAddress = $("#websocketAddress")[0].value;
	wsSessionID = "ColOSsus";
	loadWebsocket();
	$('#splash').hide();
}