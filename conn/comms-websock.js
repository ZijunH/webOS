var socketHandles = {};
var socket;
var uid;

function launch(appid) {
	var data = {
		appid: appid
	};
	var package = {
		uid: uid,
		ins: "launch",
		data: data
	};
	socket.send(JSON.stringify(package));
}

function sendWUpdate(data) {
	var package = {
		uid: uid,
		ins: "wupdate",
		data: data
	};
	socket.send(JSON.stringify(package));
}

function init() {
	dprint(wsAddress);
	socket = new WebSocket(wsAddress);
	socket.onopen = () => {
		var package = {
			ins: "handshake",
			data: {
				username: "test"
			}
		}
		socket.send(JSON.stringify(package));
		socket.onmessage = function (e) {
			var recievedData = JSON.parse(e.data);
			if (socketHandles[recievedData.ins]) {
				socketHandles[recievedData.ins](recievedData);
				uid = recievedData.uid;
			} else {
				dprint("ins" + recievedData.ins + "not found");
			}
		}
	}
}
init();
socketHandles["handshake"] = (package) => {
	uid = package.uid;
	dprint(uid);
}

socketHandles["wopen"] = (package) => {
	//uuid, appid, pos, size
	makeWindow(package.data);
}

socketHandles["wupdate"] = (package) => {
	remoteWindowUpdated(package.data);
}

// wclose
// wopen 窗口 id
// wupdate 窗口id pos
// wclose 窗口id