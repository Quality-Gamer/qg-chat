const preKey = "ms:ct";
var redis = require("./redis.js");
var md5 = require('md5');
const countKey = preKey + ":qt";
const userField = "user_id";
const messageField = "message";
const dateField = "datetime";
const readField = "read";
const newMessages = "nw"; 
const write = "wr"; 

methods = {};
global.hChat = false;

const linkUsers = (u1,u2) => {
	var key = preKey + ":lu"; //linked users
	var field1 = u1 + "/" + u2;
	var field2 = u2 + "/" + u1;
	var dt = Date.now();
	redis.data.hSetKey(key,field1,dt);
	redis.data.hSetKey(key,field2,dt);
}

methods.hasChat = async (u1,u2) => {
	var key = preKey + ":lu"; //linked users
	var field1 = u1 + "/" + u2;
	var field2 = u2 + "/" + u1;
	return await redis.data.hExistsField(key,field1).then(function(val) {return val});
}

methods.createChatRoom = (user_id_1,user_id_2) => {
	var chatHash = methods.getChatHash(user_id_1,user_id_2);
	var key1 = preKey + ":" + user_id_1;
	var key2 = preKey + ":" + user_id_2;
	redis.data.hSetKey(key1,user_id_2,chatHash);
	redis.data.hSetKey(key2,user_id_1,chatHash);
	linkUsers(user_id_1,user_id_2);
}

methods.saveChatMessages = (user_id,chatHash,message) => {
	var key = preKey + ":" + chatHash;

	redis.data.incrKey(countKey);

	chatKey = key + ":" + methods.getTimestamp();
	redis.data.hSetKey(chatKey,userField,user_id);
	redis.data.hSetKey(chatKey,messageField,message);
	redis.data.hSetKey(chatKey,dateField,Date.now());
	// redis.data.hSetKey(chatKey,readField,0);
	methods.addCountNewMessages(chatHash,user_id);
}

methods.getChatHash = (user_id_1,user_id_2) => {
	var max = Math.max(user_id_1,user_id_2);
	var min = Math.min(user_id_1,user_id_2);
	return md5(min + " - " + max);
}

methods.loadChatMessages = async (hash) => {
	// Object.entries(hash).forEach(([key, value]) => {
 	//  console.log(value);
	// });
	var key = preKey + ":" + hash;
	return methods.loadKeys(key).then(function(val) {
		return val;
	});
	// return await redis.data.hExistsField(key,field1).then(function(val) {return val});
	// return [await redis.data.hGetKey(key,'user_id').then(function(val) {console.log("promessa -> " + val); return val}),await redis.data.hGetKey(key,'message').then(function(val) {console.log("promessa -> " + val); return val}),await redis.data.hGetKey(key,'datetime').then(function(val) {console.log("promessa -> " + val); return val})];
}

methods.loadKeys = async (key) => {
	return await redis.data.keys(key).then(function(val) {
		return val;
	});
} 

methods.getTimestamp = () => {
	var d = new Date();
	return d.getTime();
}

methods.addCountNewMessages = (chatHash,uid) => {
	var key = preKey + ":" + chatHash + ":" + uid;
	redis.data.incrKey(key);
}

methods.clearCountNewMessages = (chatHash,uid) => {
	var key = preKey + ":" + chatHash + ":" + uid;
	redis.data.setKey(key,0);
}

methods.getCountNewMessages = async (chatHash,uid) => { 
	var key = preKey + ":" + chatHash + ":" + uid;
	return await redis.data.getKey(key).then(function(val) {
		return val;
	});
}

methods.updateWrite = (chatHash,uid,value) => {
	var key = preKey + ":" + chatHash + ":" + write + ":" + uid;
	redis.data.setKey(key,value);
}

methods.getWrite = async (chatHash,uid) => {
	var key = preKey + ":" + chatHash + ":" + write + ":" + uid;
	return await redis.data.getKey(key).then(function(val) {
		return val;
	});
}

methods.sortMessages = (a,b) => {
    if (a.datetime > b.datetime) {
        return 1;
    }
    if (a.datetime < b.datetime) {
        return -1;
    }
  
    // a must be equal to b
    return 0;
}

exports.data = methods;