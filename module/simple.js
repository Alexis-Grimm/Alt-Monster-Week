/**
 * A simple and flexible system for world-building using an arbitrary collection
 * of character and item attributes.
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { SimpleActor } from "./actor/actor.js";
import { MotwItemSheet } from "./Item/sheets/item-sheet.js";
import { MotwActorSheet } from "./actor/sheets/base.js";
import { preloadHandlebarsTemplates } from "./templates.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log(`Initializing Monster of the Week`);

  /**
   * Set an initiative formula for the system.
   */
  CONFIG.Combat.initiative = {
    formula: "2d6",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass = SimpleActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("altmonsterweek", MotwActorSheet, {
    types: ["hunter", "bystander", "location", "minion", "monster"],
    makeDefault: true
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("altmonsterweek", MotwItemSheet, {
    types: ["weapon", "armor", "gear", "move"],
    makeDefault: true
  });

  /**
   * Concatenate multiple strings and variables.
   * From https://stackoverflow.com/a/35862620
   */
  Handlebars.registerHelper('concat', function() {
    var arg = Array.prototype.slice.call(arguments,0);
    arg.pop();
    return arg.join('');
  });

  /**
   * Repeat a block N times, setting `timesIndex` to the index of each
   * iteration. From https://stackoverflow.com/a/11924998
   */
  Handlebars.registerHelper('times', function(n, type, block) {
    let accum = '';
    //console.log(type);

    if (type == "experience") {

      this.isXP = true;
      for(let i = 0; i < n; i++) {
        this.timesIndex = i;
        accum += block.fn(this);
      }

    } else if (type == "harm") {

      this.isXP = false;
      for(let i = n; i > 0; i--) {
        if (i == 6) {
          this.bar = true;
        } else {
          this.bar = false;
        }
        this.timesIndex = i;
        accum += block.fn(this);
      }
  
    } else {
      
      this.isXP = false;
      for(let i = n; i > 0; i--) {
        this.timesIndex = i;
        accum += block.fn(this);
      }

    }

    //console.log(this.isXP);
    return accum;
  });

  /**
   * Return true if one value is less than another.
   */
  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });

  Handlebars.registerHelper('ltConnect', function(a, b) {
    return a <= b;
  });

  /**
   * Returns true if the argument is a boolean.
   */
  Handlebars.registerHelper('isBoolean', function(o) {
    return typeof o === "boolean"
  });

  /**
   * Returns true if the argument string is non-empty.
   */
  Handlebars.registerHelper('isNonEmptyString', function(str) {
    return str !== "";
  });

  /**
   * Splits a string using the provided separator string.
   */
  Handlebars.registerHelper('split', function(str, sep) {
    if (!str) {
      // empty, null, undefined, etc.
      return [];
    }
    let parts = str.split(sep);
    if (parts.length == 1 && parts[0] === "") {
      return [];
    }
    return parts;
  });

  /**
   * Tests if the input data type is the same as the type.
   */
  Handlebars.registerHelper('isType', function(type, input) {
    //console.log(input);
    return type == input;
  });

  /**
   * Repeat a block N times, setting `timesIndex` to the index of each
   * iteration. From https://stackoverflow.com/a/11924998
   */
  Handlebars.registerHelper('timesHarm', function(n, block) {
    var accum = '';
    
    for(let i = 0; i < n; i++) {
      if (i == 2) {
        this.bar = true;
      } else {
        this.bar = false;
      }
      this.timesIndex = i;
      accum += block.fn(this);
    }

    return accum;
  });

  // Preload template partials.
  preloadHandlebarsTemplates();
});

/* -------------------------------------------- */

// Override the default icons for items.
Hooks.on("createItem", item => {
  //console.log(item);
  let MYSTERY_MAN_ICON = "icons/svg/item-bag.svg";

  // TODO: Consolidate this with the similar list in actor-sheet.js.
  let DEFAULT_GEAR_ICON = "icons/svg/chest.svg";
  let DEFAULT_WEAPON_ICON = "icons/svg/combat.svg";
  let DEFAULT_ARMOR_ICON = "icons/svg/statue.svg";
  let DEFAULT_MOVE_ICON = "icons/svg/book.svg";
  //console.log(item.data.type);
  var newImg = DEFAULT_GEAR_ICON;
  if (item.data.type === "weapon") {
    newImg = DEFAULT_WEAPON_ICON;
  }
  else if (item.data.type === "armor") {
    newImg = DEFAULT_ARMOR_ICON;
  }
  else if (item.data.type === "move") {
    newImg = DEFAULT_MOVE_ICON;
  }
  //console.log(item.data.img);
	item.update({
    img: (!item.data.img || item.data.img === MYSTERY_MAN_ICON)
        ? newImg
        : item.data.img
  });
});

Hooks.once('setup', async function() {
  // Pre-cache these or else the first time we load the sheet it will overwrite
  // the image we patch in. Thanks to
  // https://github.com/schultzcole/FVTT-Default-Image-Overrider for this trick!
	await Promise.all([
		getTemplate("systems/altmonsterweek/templates/actors/actor-sheet.html"),
		getTemplate("systems/altmonsterweek/templates/items/item-sheet.html"),
	]);
});