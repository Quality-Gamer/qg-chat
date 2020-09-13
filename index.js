const express = require("express");
const path = require("path");
var redis = require("./redis.js");
var utils = require("./methods.js");

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const noWrite = 0;
const yesWrite = 1;

var porta = process.env.PORT || 8080;

app.use('/', (req,res) => {
	// console.log("Conectado na porta " + porta);
});

io.on('connection', async socket => {
	// console.log(io.sockets.adapter.rooms);
	// console.log(`Socket conectado: ${socket.id}`);
	socket.on('openChatRoom', async data => {
		var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
		// console.log("user_id -> "+ data.user_id_1 + " chatHash -> "+chatHash);
		socket.join(chatHash, () => {
			// console.log("join room");
		});
		await utils.data.hasChat(data.user_id_1,data.user_id_2).then(async function(value) {
			if(!value) {
			// console.log("Creating chat room ...")
			utils.data.createChatRoom(data.user_id_1,data.user_id_2);
			} else {
				var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
				await utils.data.loadChatMessages(chatHash).then(function(msg) {
					// console.log(msg)
					msg.forEach(async k => {
						if(k) {
							await redis.data.hGetKeyAll(k).then(function(v) {
								var message = '{'
							       +'"message" : "'+v.message+'",'
							       +'"datetime"  : "'+v.datetime+'",'
							       +'"user_id" : "'+v.user_id+'"'
							       +'}';
							       socket.send(message);
							});
						}
					});
				});
				// console.log("Loading messages ...")
			}
		});
	});

	socket.on('sendMessage', data => {
		// console.log("Sending message ...")
		var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
		utils.data.saveChatMessages(data.user_id_1,chatHash,data.message);
		var message = '{'
				       +'"message" : "'+data.message+'",'
				       +'"datetime"  : "'+utils.data.getTimestamp()+'",'
				       +'"user_id" : "'+data.user_id_1+'"'
				       +'}';
	   socket.send(message);
	   socket.broadcast.to(chatHash).emit('message', message);
	});



socket.on('news', async data => {
	var key = "ms:ct:lu";
	await redis.data.hGetKeyAll(key).then(function(v) {
	       Object.entries(v).forEach(async ([key, value]) => {
	       	  var [uid1,uid2] = key.split('/');
   			  if(uid1 == data.user_id_1) {
				 var chatHash = utils.data.getChatHash(uid1,uid2);
				 await utils.data.getCountNewMessages(chatHash,uid2).then(function(count) {
				 	var ret = '{"user_id" : "'+uid2+'",'+'"count" : "'+count+'"}';
			 	    socket.send(ret);
			 	    socket.broadcast.emit('message', ret);
				 });
   			  }
			});
	});
});

socket.on('read', async data => {
	 var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
	 utils.data.clearCountNewMessages(chatHash,data.user_id_2);
});

socket.on('startWrite', async data => {
	 var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
	 utils.data.updateWrite(chatHash,data.user_id_1,yesWrite);
});

socket.on('stopWrite', async data => {
	 var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
	 utils.data.updateWrite(chatHash,data.user_id_1,noWrite);
});

socket.on('write', async data => {
	 var chatHash = utils.data.getChatHash(data.user_id_1,data.user_id_2);
	 await utils.data.getWrite(chatHash,data.user_id_2).then(function(v) {
	 	var ret = '{"user_id" : "'+data.user_id_2+'",'+'"writing" : "'+v+'"}';
	 	socket.send(ret);
	 });
});

});

server.listen(porta);


