const redis = require('redis'),
  client    = redis.createClient({
    port      : 6379,               
    host      : '127.0.0.1',        
    // password  : '',    
   
  });

methods = {};

methods.hSetKey = (key,field,value) => {
	client.hset(key, field, value, redis.print);
};

methods.hGetKey = async (key,field) => {
	var promise = new Promise( (resolve, reject) => {
    	client.hget(key, field, (err,value) => {
    		if(err) {
    			reject(err);
    		} else {
    			resolve(value);
    		}
    	});
	});
	return promise;
};

methods.hGetKeyAll = async (key) => {
	var promise = new Promise( (resolve, reject) => {
    	client.hgetall(key, (err,value) => {
    		if(err) {
    			reject(err);
    		} else {
    			resolve(value);
    		}
    	});
	});
	return promise;
};

methods.keys = async (key) => {
	var promise = new Promise( (resolve, reject) => {
    	client.keys("*"+key+"*", (err,value) => {
    		if(err) {
    			reject(err);
    		} else {
    			resolve(value);
    		}
    	});
	});
	return promise;
};

methods.incrKey = (key) => {
	client.incr(key,redis.print)
};

methods.getKey = async (key) => {
	var promise = new Promise( (resolve, reject) => {
    	client.get(key,(err,value) => {
    		if(err) {
    			reject(err);
    		} else {
    			resolve(value);
    		}
    	});
	});
	return promise;
};

methods.setKey = (key,value) => {
 	client.set(key,value,redis.print);
};

methods.hExistsField = async (key,field) => {
	var promise = new Promise( (resolve, reject) => {
    	client.hexists(key,field,(err,value) => {
    		if(err) {
    			reject(err);
    		} else {
    			resolve(value);
    		}
    	});
	});
	return promise;
}

exports.data = methods;