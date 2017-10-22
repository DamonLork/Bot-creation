// Load up the discord.js library
const Discord = require("discord.js");

// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  // Example of changing the bot's playing game to something useful.
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});


client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  //Ignore other bots. This also makes your bot ignore itself
  if(message.author.bot) return;
  
  //Ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  
  
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  if(command === "say") {
    // makes the bot say something and delete the message.
    const sayMessage = args.join(" ");
    // Then delete the command message.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }

  client.on('guildMemberAdd', member => {
    // Send the message to a designated channel on a server:
    const channel = member.guild.channels.find('name', 'member-log');
    // Do nothing if the channel wasn't found on this server
    if (!channel) return;
    // Send the message, mentioning the member
    channel.send(`Welcome to the server, ${member}`);
  });

  if(command === "kick") {
    // This command is limited to mods and admins.
    if(!message.member.roles.some(r=>["Administrator", "Moderator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    //Check if we have a member and if he can kick them!
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.kickable) 
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
    
    // slice(1) removes the first part, which here should be the user mention!
    let reason = args.slice(1).join(' ');
    if(!reason)
      return message.reply("Please indicate a reason for the kick!");
    
    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }
  
  if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    if(!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.bannable) 
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if(!reason)
      return message.reply("Please indicate a reason for the ban!");
    
    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }
  
  if(command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.
    
    // get the delete count, as an actual number. (sounds good, doesn't work)
    const deleteCount = parseInt(args[0], 10);
    
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    
    //Get our messages, and delete them.
    const fetched = await message.channel.fetchMessages({count: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }
  //this mutes the user in the server making him unavailable to write
  if (command === "mute") {
  if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.sendMessage("You do not have the required role.");
  
		  let toMute = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0]);
		  if(!toMute) return message.channel.send("You did not specify a user mention or ID. :confused:");
	  
		  if(toMute.id === message.author.id) return message.channel.send("You cannot mute yourself!!");
		  if(toMute.highestRole.position >= message.member.highestRole.position) return message.channel.sendMessage("You cannot mute a member who is higher or has the same role as you!"); 
	  
		  let role = message.guild.roles.find(r => r.name === "Cyber Muted");
		  if(!role) {
			  try{
				  role = await message.guild.createRole({
					  name: "Cyber Muted",
					  color:"#000000",
					  permissions: []
				  });
  
				  message.guild.channels.forEach(async (channel, id) => {
					  await channel.overwritePermissions(role, {
						  SEND_MESSAGES : false,
						  ADD_REACTIONS : false
					  });
				  });
			  } catch(e) {
				  console.log(e.stack);
			  }
		  }
		  if(toMute.roles.has(role.id)) return message.channel.send("This user is already muted!!");
	  
		  await toMute.addRole(role);
		  message.channel.send("I have muted them.");
    }
    //This unmutes the user who had been previously muted 
    if (command === "unmute") {
    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.sendMessage("You do not have the required role.");
    
        let toMute = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0]);
        if(!toMute) return message.channel.send("You did not specify a user mention or ID. :confused:");
        
        let role = message.guild.roles.find(r => r.name === "Cyber Muted");
       
        if(!role || !toMute.roles.has(role.id)) return message.channel.send("This user is not muted!!");
        
        await toMute.removeRole(role);
        message.channel.send("User unmuted .");
    }

    //currently under work !! 
    let myRole = message.guild.roles.find("testrole", "Moderators");
    
    if (command === "addrole") {
    let role = message.guild.roles.find("testrole", "OWNER");
    
    let member = message.mentions.members.first();
    

    
    // Add the role!
    member.addRole(role).catch(console.error);
    }
    if (command === "removerole") {
      
      let role = message.guild.roles.find("testrole", "OWNER");

      let member = message.mentions.members.first();
      
    // Remove a role!
    member.removeRole(role).catch(console.error);

    }
});

client.login(config.token);
