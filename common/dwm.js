///Debugging related functions. Set localDebug to false to make everything server dependent.
var localDebug = true;
function dprint(message) {
	if (localDebug) {
		console.log(message);
	}
}
var idStor = {};
function gen_uid() {
	do {
		var rid = Math.floor(Math.random() * 1000);
	} while (idStor[rid]);
	idStor[rid] = true;
	return rid;
}

$(document).ready(() => {
	$("body").on("mouseup", moveEnd);
	$("body").on("mousemove", moveCont);

	$("body").on("mousedown", defocus_all);

	$("body").on("mousedown", panStart);
	$("body").on("mousemove", panMove);
	$("body").on("mouseup", panEnd);

	//newUser();
});

/////Panning view
var panX = 0;
var panY = 0;
var panMouseX = 0;
var panMouseY = 0;
var panning = false;
function panStart(e) {
	//check if this is actually a pan event
	if (e.target == $("body")[0] && e.button == 2) {
		panning = true;
		panMouseX = e.pageX;
		panMouseY = e.pageY;
	}
}

function panMove(e) {
	//check if we are panning
	if (panning) {
		panX += e.pageX - panMouseX;
		panY += e.pageY - panMouseY;
		panMouseX = e.pageX;
		panMouseY = e.pageY;
		//report new view coordinates
		try {
			viewportPan(panX, panY);
		} catch (e) {
			disconnected();
		}

		//Move literally every window
		$("#desktop>div").each((i, e) => {
			e.style.left = panX + parseInt(e.dataset.underLeft) + "px";
			e.style.top = panY + parseInt(e.dataset.underTop) + "px";
		});
	}
}

function panEnd(e) {
	if (panning) {
		panning = false;
	}
}
/////MOVING WINDOWS AROUND
var movTarg;
var moving = false;

function moveStart(e) {
	movTarg = e.currentTarget.parentElement;
	movTarg.dataset.delX = e.pageX;
	movTarg.dataset.delY = e.pageY;
	moving = true;
	//movTarg.dataset.moving=true;
}

function moveCont(e) {
	if (moving) {
		movTarg.dataset.underLeft = parseInt(movTarg.dataset.underLeft) + parseInt(e.pageX) - parseInt(movTarg.dataset.delX);
		movTarg.dataset.underTop = parseInt(movTarg.dataset.underTop) + parseInt(e.pageY) - parseInt(movTarg.dataset.delY);

		movTarg.dataset.delX = e.pageX;
		movTarg.dataset.delY = e.pageY;

		movTarg.style.left = (panX + parseInt(movTarg.dataset.underLeft)) + "px";
		movTarg.style.top = (panY + parseInt(movTarg.dataset.underTop)) + "px";

		var data = {
			uuid: movTarg.id,
			pos: { y: parseInt(movTarg.style.left), x: parseInt(movTarg.style.top) },
			size: {x: parseInt(movTarg.style.width), y: parseInt(movTarg.style.height)}
		}
		sendWUpdate(data);
	}
}
function moveEnd(e) {
	moving = false;
}

//////////WINDOW FOCUS
function defocus_all() {
	$(".window").each((i, e) => {
		e.classList.remove("focused");
	});
	$(".barItem").each((i, e) => {
		e.classList.remove("focused");
	});
}

function focusWnd(e) {
	try {
		e.stopImmediatePropagation();
		e = e.currentTarget;
	} catch (err) {
	}
	defocus_all();
	e.classList.add("focused");
	$("#i_" + e.id)[0].classList.add("focused");
	e.dataset.preW = e.style.width;
	e.dataset.preH = e.style.height;
}

function checkResize(e) {
	if (e.currentTarget) {
		e.stopImmediatePropagation();
		e = e.currentTarget;
	}
	if (e.style.height - e.dataset.preH != 0 || e.style.width - e.dataset.preW != 0) {
		var updateData = {
			id: e.id,
			top: e.style.top,
			left: e.style.left,
			width: e.style.width,
			height: e.style.height,
		}
		try {
			remoteUpdateWindow(updateData);
		} catch (e) {
			disconnected();
		}

	}
}

//////// taskbar
function wndIconClick(e) {
	focusWnd($("#" + e.currentTarget.id.substring(2))[0]);
}

// clicking the charm
function showStartMenu() {
	$("#startMenu").toggle();
}

////////window opening and closing.


function closeWnd(e) {
	var opWnd = e.currentTarget.parentElement.parentElement;
	var wid = opWnd.id;
	//for an ordinary window:
	//detach window from DOM
	opWnd.remove();
	//detach taskbar icon from DOM
	var tbIt = $("#i_" + wid)[0];
	tbIt.remove();
	e.stopImmediatePropagation();
}



function makeWindow(data) {
	dprint(data);
	// Create the window div
	newWnd = $("#proto>.window")[0].cloneNode(true);
	newWnd.id = data.uuid;
	$("#desktop").append(newWnd);
	newWnd.children[0].addEventListener("mousedown", moveStart);
	newWnd.children[0].children[1].addEventListener("mousedown", closeWnd);
	newWnd.addEventListener("mousedown", focusWnd);
	newWnd.dataset.underLeft = newWnd.offsetLeft - panX;
	newWnd.dataset.underTop = newWnd.offsetTop - panY;
	//Handle special windows
	newWnd.children[0].children[0].innerText = data.appid;
	newWnd.append(document.createElement("iframe"));
	newWnd.children[1].src = data.appid;
	// Create the taskbar icon
	newIco = $("#proto>.wnd_barItem")[0].cloneNode(true);
	newIco.id = "i_" + newWnd.id;
	$("#winlist").append(newIco);
	newIco.addEventListener("click", wndIconClick);
	//newIco.addEventListener("click",focusWindow);
	newWnd.style.top = data.pos.x;
	newWnd.style.left = data.pos.y;
	newWnd.style.height = data.size.y;
	newWnd.style.width = data.size.x;



	focusWnd(newWnd);
	$("#startMenu").hide();
}

/////USER STUFFS MANANAGEMENT
function newUser() {//create an external user. not called when self is created.

	//create new user box
	newUBox = $("#proto>.uBox")[0].cloneNode(true);
	newUBox.id = gen_uid();
	$("#desktop").append(newUBox);


	newIco = $("#proto>.usr_barItem")[0].cloneNode(true);
	newIco.id = "i_" + newUBox.id;
	$("#winlist").append(newIco);



}

////Remotes

function disconnected() {
	$("#disconnectedMessage").show();

}

function remoteMakeWindow(data) {
	//Window was made by an external entity. Fill in details as provided.
	var newWnd;
	// data is a JSON object

	newWnd = $("#proto>.window")[0].cloneNode(true);
	newWnd.id = data.uuid;
	$("#desktop").append(newWnd);
	newWnd.children[0].addEventListener("mousedown", moveStart);
	newWnd.children[0].children[1].addEventListener("mousedown", closeWnd);
	newWnd.addEventListener("mousedown", focusWnd);
	newWnd.append(document.createElement("iframe"));
	newWnd.children[1].src = data.src;
	newWnd.style.top = data.pos.x;
	newWnd.style.left = data.pos.y;
	newWnd.style.width = data.width;
	newWnd.style.height = data.height;
	newWnd.dataset.underLeft = newWnd.offsetLeft - panX;
	newWnd.dataset.underTop = newWnd.offsetTop - panY;

	// Create the taskbar icon
	newIco = $("#proto>.wnd_barItem")[0].cloneNode(true);
	newIco.id = "i_" + newWnd.id;
	$("#winlist").append(newIco);
	newIco.addEventListener("click", wndIconClick);
}

function remoteWindowUpdated(data) {
	wnd = $("#" + data.uuid)[0];
	wnd.style.top = data.pos.x;
	wnd.style.left = data.pos.y;
	wnd.style.width = data.size.x;
	wnd.style.height = data.size.y;
}

function remoteCloseWnd(id) {
	//for an ordinary window:
	//detach window from DOM
	$("#" + id)[0].remove();
	opWnd.remove();
	//detach taskbar icon from DOM
	var tbIt = $("#i_" + id)[0];
	tbIt.remove();

}

////creating windows
//byExt is true means this window was not made by the user

