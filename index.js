const express = require("express");
const path = require("path");
var redis = require("./redis.js");
var utils = require("./methods.js");

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var porta = process.env.PORT || 8080;

app.use('/', (req,res) => {
	// console.log("Conectado na porta " + porta);
});

io.on('connection', async socket => {
	// console.log(io.sockets.adapter.rooms);
	// console.log(`Socket conectado: ${socket.id}`);
	socket.on('openChatRoom', async data => {
		var max = Math.max(data.user_id_1,data.user_id_2);
		var min = Math.min(data.user_id_1,data.user_id_2);
		var chatHash = utils.data.getChatHash(min,max);
		// console.log("user_id -> "+ data.user_id_1 + " chatHash -> "+chatHash);
		socket.join(chatHash, () => {
			// console.log("join room");
		});
		await utils.data.hasChat(data.user_id_1,data.user_id_2).then(async function(value) {
			if(!value) {
			// console.log("Creating chat room ...")
			utils.data.createChatRoom(data.user_id_1,data.user_id_2);
			} else {
				var max = Math.max(data.user_id_1,data.user_id_2);
				var min = Math.min(data.user_id_1,data.user_id_2);
				var chatHash = utils.data.getChatHash(min,max);
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
								   socket.broadcast.to(chatHash).emit('message', message);
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
		var max = Math.max(data.user_id_1,data.user_id_2);
		var min = Math.min(data.user_id_1,data.user_id_2);
		var chatHash = utils.data.getChatHash(min,max);
		utils.data.saveChatMessages(data.user_id_1,chatHash,data.message);
		var message = '{'
				       +'"message" : "'+data.message+'",'
				       +'"datetime"  : "'+utils.data.getTimestamp()+'",'
				       +'"user_id" : "'+data.user_id_1+'"'
				       +'}';
		socket.broadcast.to(chatHash).emit('message', message);
	});
});

server.listen(porta);


