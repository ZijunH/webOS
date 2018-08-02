

function makeActorID(){
	return Math.floor(Math.random()*1000);
}

// Initialize Firebase

firebase.initializeApp(fbConfig);

var actorID;
var sessionChunk;
function init(sessionID){
	sessionChunk = firebase.database().ref(sessionID);
	sessionChunk.once("value",(data)=>{
		if (data.val()){
			connectDone();
		}else{
			initWorkspace(sessionID);
		}
	});
}
init(fbConnItem);
function initWorkspace(sessionID){
	var workspaceObject={};
	workspaceObject[sessionID]={
		wnds:{},
		updates:"",
		actorIDs:makeActorID()
	}
	firebase.database().ref().update(workspaceObject);
	sessionChunk=firebase.database().ref(sessionID);
	//start listening for updates
	registerUpdateListener();

}
function registerUpdateListener(){
	updates=sessionChunk.child("updates");
	updates.on("value",(datasnapshot)=>{
		if (datasnapshot.val().length>0){
			var updateContent=JSON.parse(datasnapshot.val());
			//dont handle own updates
			switch (updateContent.type){
				case "newWnd":
					remoteMakeWindow(updateContent.data);
					break;
				case "updateWnd":
					if (updateContent.actor==actorID)return;
					remoteWindowUpdated(updateContent.data);
					break;
				case "closeWnd":
					if (updateContent.actor==actorID)return;
					remoteCloseWnd(updateContent.id);
					break;
			}
		}
	});
}
function connectDone(){
	//Connect to an existing workspace

	//Generate a unique actor ID
	sessionChunk.child("actorIDs").once("value",(data)=>{
		var allActors=data.val().toString();
		var actorList=allActors.split("|");
		do{
			actorID=makeActorID();
		}while (actorList.includes(actorID));
		allActors=allActors+"|"+actorID;
		sessionChunk.child("actorIDs").set(allActors);
	});

	//Open all existing windows
	wndChunk=sessionChunk.child("wnds");
	wndChunk.once("value",(datasnapshot)=>{
		datasnapshot.forEach(function (child){
			var datapackage=JSON.parse(child.val());
			datapackage.id=child.key;

			remoteMakeWindow(datapackage);
		});
	});
	//start listening for updates
	registerUpdateListener();
}

function remoteNewWindow(data){
	var updateContent={
		type: "newWnd",
		data: data,
		actor: actorID
	};
	var strOut = JSON.stringify(updateContent);
	sessionChunk.child("updates").set(strOut);
	//also update the static window register
	var staticContent={};
	var newkey=data.id;
	delete data.id;
	staticContent[newkey]=JSON.stringify(data);
	sessionChunk.child("wnds").update(staticContent);
}

function remoteUpdateWindow(data){
	var updateContent={
		type: "updateWnd",
		data: data,
		actor: actorID
	};
	var strOut = JSON.stringify(updateContent);
	sessionChunk.child("updates").set(strOut);

	//also update the static window register
	var staticContent={};
	var newkey=data.id;
	delete data.id;
	staticContent[newkey]=JSON.stringify(data);
	sessionChunk.child("wnds").update(staticContent);
}


function remoteCloseWindow(data){
	var updateContent={
		type: "closeWnd",
		id: id,
		actor: actorID
	};
	var strOut = JSON.stringify(updateContent);
	sessionChunk.child("updates").set(strOut);

	//also update the static window register
	sessionChunk.child("wnds").child(data.id).remove();
}
