var socketHandles = {};
var socket;
var uid;

function init(sessionID) {
	dprint(wsAddress);
	socket = new WebSocket(wsAddress);
	socket.onopen = () => {
		var initialRequest = {
			ins: "handshake"
		}
		socket.send(JSON.stringify(initialRequest));
		socket.onmessage = function(e) {
			var recievedData = JSON.parse(e.data);
			if (socketHandles[recievedData.ins]) {
				socketHandles[recievedData.ins](recievedData);
				uid = recievedData.uid;
			}else{
				dprint("ins" + recievedData.ins + "not found");
			}
		}
	}
}

init(wsSessionID);


socketHandles["handshake"] = (data) => {
	uid = data.uid;
	dprint(uid);
}


socketHandles["wopen"] = (data) => {
	//uuid, appid, pos, size
	remoteMakeWindow(data.appid);
}

function remoteNewWindow(appid) {
	var updateContent = {
		uid: uid,
		ins: "launch",
		data: { appid: appid }
	};
	// updateContent=Object.assign(data,updateContent);
	socket.send(JSON.stringify(updateContent));
}

socketHandles["wupdate"] = (data) => {
	remoteWindowUpdated(data);
}

function remoteUpdateWindow(data) {
	var updateContent = {
		ins: "wupdate",
		uid: uid,
		data: data
	};
	socket.send(JSON.stringify(updateContent));
}

function viewportPan(panX, panY) {
	return;
}


// wclose
// wopen 窗口 id
// wupdate 窗口id pos
// wclose 窗口id