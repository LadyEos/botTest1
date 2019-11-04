const Discord = require('discord.js'); 
const moment = require("moment")
const client = new Discord.Client();  
const defaultDateRange = {amount:5, type:"days"};

client.on('ready', () => {   
    console.log(`Logged in as ${client.user.tag}!`); 
});
client.on('message', async msg => {  
    if(msg.author.bot) return;
    if (msg.author == client.user) return;
    if (msg.content.startsWith("!")) {
        processCommand(msg)
    }
});

async function processCommand(receivedMessage) {
    let fullCommand = receivedMessage.content.substr(1) // Remove the leading exclamation mark
    let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
    let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
    let arguments = splitCommand.slice(1) // All other words are arguments/parameters/options for the command

    console.log("Command received: " + primaryCommand)
    console.log("Arguments: " + arguments) // There may not be any arguments

    if (primaryCommand == "help") {
        helpCommand(arguments, receivedMessage)
    } else if (primaryCommand == "status") {
        statusCommand(arguments, receivedMessage)
    } else if (primaryCommand == "statusAll") {
        statusAllCommand(arguments, receivedMessage)
    } else {
        receivedMessage.channel.send("I don't understand the command. Try `!help` or `!status`")
    }
}

function helpCommand(arguments, receivedMessage) {
    if (arguments.length > 0) {
        receivedMessage.channel.send("It looks like you might need help with " + arguments)
    } else {
        receivedMessage.channel.send("I'm not sure what you need help with. Try `!help [topic]`")
    }
}

function statusCommand(arguments, receivedMessage) {
	//TODO: check if @ for mention if not look up by username
	
	console.log(`jaslkdklas ------ `+JSON.stringify(defaultDateRange)); 
    console.log(`Received message ${receivedMessage}`); 
    console.log(`Guild ${receivedMessage.guild}`); 

    if (arguments.length == 1) {
    	let user = client.users.find(user => user.username === arguments[0]);
		
		receivedMessage.guild.fetchMember(user).then(function(member){
	  		console.log(`class ${member.constructor.name}`);
	    	console.log(`class ${member.displayName}`);

	    	let lastMessageDate = moment(member.lastMessage.createdAt);
	    	let threshold = moment().subtract(defaultDateRange['amount'], defaultDateRange['type']);
	    	console.log(`message Date ${lastMessageDate.format("YYYY/MM/DD, h:mm:ss")}`);
	    	console.log(`threshole Date ${threshold.format("YYYY/MM/DD, h:mm:ss")}`);
			
			let role = receivedMessage.guild.roles.find(role => role.name === "inactive");
			if(!isMemberActive(threshold, lastMessageDate)){
        		assignRole(member,role);
	        }else{
	        	//TODO activate member if inactive
	        	console.log(`${member} is active. no role assigned`);
	        }

	    	return true;
		}).catch(console.error);

    } else if (arguments.length == 2) {
        receivedMessage.channel.send(" wtf Not enough values to multiply. Try `!multiply 2 4 10` or `!multiply 5.2 7`")
        return
    }
    
    // receivedMessage.channel.send("The product of " + arguments + " multiplied together is: " + product.toString())
}

async function statusAllCommand(arguments, receivedMessage) {
    console.log(`statusAll ------ `+JSON.stringify(defaultDateRange)); 
    console.log(`Received message ${receivedMessage}`); 
    let guild = receivedMessage.guild
    console.log(`Guild ${guild}`); 

    let threshold = null;

    if (arguments.length == 1) {
    	let argument = arguments[0].split('"').join('');
        let timeLimit = argument.split(" ");
        if(timeLimit.length != 2){
        	receivedMessage.channel.send("Time limit not valid. Please input a number and a metric of time between double quotes (\"). Try `!statusAll \"30 days\"` or `!statusAll \"50 minutes\"`")
        }

        threshold = moment().subtract(timeLimit[0], timeLimit[1]);
    }else if(arguments.length > 1){
		receivedMessage.channel.send("Too many arguments!! Please input a number and a metric of time between double quotes (\"). Try `!statusAll \"30 days\"` or `!statusAll \"50 minutes\"`")
    }else{
    	threshold = moment().subtract(defaultDateRange['amount'], defaultDateRange['type']);
    }

    let inactiveRole = receivedMessage.guild.roles.find(role => role.name === "inactive");
    let activeRole = receivedMessage.guild.roles.find(role => role.name === "active");
    
    let members = guild.fetchMembers().then(r => {
      r.members.array().forEach(member => {
        if(!member.user.bot){
        	// let username = `${member.user.username}#${member.user.discriminator}`;
         	console.log(`- member id ${member.id} - member username ${member.user.username}`);

	        let userLastMessage = member.lastMessage;
	        console.log(`-----last message ---- ${userLastMessage}`);
	        if(userLastMessage){ //since bot has been active
	        	console.log(`--- has last message`);
	        	let lastMessageDate = moment(userLastMessage.createdAt);
		        if(!isMemberActive(threshold, lastMessageDate)){
		        	assignRole(member,inactiveRole);
		        }else{
		        	//TODO activate member if inactive
		        	//TODO set all members active
		        	console.log(`${member.user.username} is active. no role assigned`);
		        }
	        }else{//before bot activity
	        	console.log(`--- combing channels for member ${member.user.username}`);
	        	//let isUseractive = 
	        	combChannels(member, guild, threshold).then(result =>{
	        		if(result === false){
	        			assignRole(member,inactiveRole);
	        			console.log(`role ${inactiveRole.name} added successfully after combing channels`); 
		        	}else{
		        		//TODO activate member if inactive
			        	//TODO set all members active
			        	console.log(`combed channels ${member.user.username} is active. no role assigned`);
		        	}
	        	});
	        }
        }
      });
      receivedMessage.channel.send("finished executing (this is a lie bc async)");
    }).catch(console.error);
}

function findUserLastMessageInBatch(member, messages, threshold){
	console.log(`------- total ${messages.size} messages`);

	messages.sort(function (a , b){ //sort by date
		let aDate = moment(a.createdAt);
		let bDate = moment(b.createdAt);

		//console.log(`------- ${aDate.format("YYYY/MM/DD, h:mm:ss")} --- ${bDate.format("YYYY/MM/DD, h:mm:ss")}`);
		if (aDate.isAfter(bDate)) { //a > b
			return -1;
		}
		if (aDate.isBefore(bDate)) {//b > a
			return 1;
		}
		return 0;
	});

  	let filteredMessagesByDate = messages.filter(m => moment(m.createdAt).isAfter(threshold));

  	let numMessages = filteredMessagesByDate.size;
  	console.log(`------- per user ${numMessages} messages`);

  	if(numMessages > 0){
  		
  		let filteredMessages = filteredMessagesByDate.filter(m=> m.author === member.user);
  		if(filteredMessages.size > 0){
			filteredMessages.forEach((m) => {
  				console.log(`.- ${m.content} at ${moment(m.createdAt).format("YYYY/MM/DD, h:mm:ss")}`);
  			});
			console.log(`------- USER IS ACTIVE ${member.user.username}`);
	  		return true; //user is active
  		}else{
  			//not found messages of member, keep looking farther
  			console.log(`------- look further back`);
  			let earliestMessage = messages.last(1);
  			return earliestMessage;
  		}
  	}else{
  		console.log(`------- after date`);
  		return false; 
  		//out of threshold date
  	}
}


async function checkChannelForUserLastMessage(member, channel, threshold, lastMessageOffset){
	//starting point
	console.log(`------- entered checkChannelForUserLastMessage - channel ${channel.name} user ${member.user.username}`);
	let result = false;
	try{
		if(!lastMessageOffset){ //initial call per channel
			console.log(`------- first pass before waiting - channel ${channel.name} user ${member.user.username}`);
			let messages = await channel.fetchMessages({limit: 100});
			console.log(`------- first pass dud ut waut? ${messages.size} - channel ${channel.name} user ${member.user.username}`);
	  		if(messages.size > 0){ //check for no messages in channel
	  			console.log(`-- before calling find in batch - channel ${channel.name} user ${member.user.username}`);
	  			return findUserLastMessageInBatch(member, messages, threshold);	
	  		}else{
	  			console.log(`-- first pass no messages in channel - channel ${channel.name} user ${member.user.username}`);
	  			return false;
	  		}
		}else{
			console.log(`------- before awaiting with offset - channel ${channel.name} user ${member.user.username}`);
			let messages = await channel.fetchMessages({limit: 100, before: lastMessageOffset.id});
			console.log(`------- awaited? with offset ${messages.size} - channel ${channel.name} user ${member.user.username}`);
	  		if(messages.size > 0){ //check for no messages in channel
	  			console.log(`-- before calling find in batch from offset - channel ${channel.name} user ${member.user.username}`);
	  			return findUserLastMessageInBatch(member, messages, threshold);	
	  		}else{
	  			console.log(`-- other passes no messages in channel - channel ${channel.name} user ${member.user.username}`);
	  			return false;
	  		}
		}
	}catch(error){
		console.error
	}
	
	//out point
	if(result === true || result === false){
		console.log(`-- resuuuuults ${result} - channel ${channel.name} user ${member.user.username}`);
		return result;
	}else{
		console.log(`-- call again ${result.content} - channel ${channel.name} user ${member.user.username}`);
		return await checkChannelForUserLastMessage(member,channel, threshold, result);
		// console.log(`------- to not cycle por mientras`);
		// return false;
	}
}

async function combChannels(member, guild, threshold){
	console.log(`--- start combing channels for user ${member.user.username}`);
	guild.channels.forEach((channel) => { //
		console.log(`---+ ${channel.name} + ${channel.type}`);
		if(channel.type === "text"){ //look only in text channels
			console.log(`---+ is text`);
			let result = await checkChannelForUserLastMessage(member, channel, threshold, null);
			console.log(`---+ result for channel ${result} - channel ${channel.name} user ${member.user.username}`);
			if(result === true){
				//user is active
				console.log(`---+--- user is active user ${member.user.username}`);
				return true;
			}
		}
	});
	//not found in any channels during period of time: user is inactive
	console.log(`---+--- not found user is inactive  user ${member.user.username}`);
	return false;
}

function assignRole(member, role){
	if(!member.roles.array().includes(role)){
		member.addRole(role);
		console.log(`role ${role} added successfully`); 
	}
}

function removeRole(member, role){
	if(!member.roles.array().includes(role)){
		member.removeRole(role);
		console.log(`role ${role} removed successfully`); 
	}
}

function doesMemberHaveRole(member, role){
	if(member.roles.array().includes(role))
		return true;
	else
		return false;
}

function isMemberActive(threshold, lastMessageDate){
	if(lastMessageDate.isBefore(threshold)){
		return false; 
	}
	return true;
}

client.login('NjM5ODUwNzk5MzY2OTMwNDUy.Xbxe6A.8LnHWqfiWep8L4wvqQ29OE9Qj_8');