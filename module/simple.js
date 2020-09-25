/**
 * A simple and flexible system for world-building using an arbitrary collection
 * of character and item attributes.
 * Author: Atropos
 * Software License: GNU GPLv3
 */

// Import Modules
import { SimpleActor } from "./actor.js";
import { SimpleItemSheet } from "./item-sheet.js";
import { SimpleActorSheet } from "./actor-sheet.js";
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
  CONFIG.Actor.entityClass = SimpleActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("monsterweek", SimpleActorSheet, {
    types: ["hunter", "bystander", "location", "minion", "monster"],
    makeDefault: true
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("monsterweek", SimpleItemSheet, {
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

  // Preload template partials.
  preloadHandlebarsTemplates();
});

/* -------------------------------------------- */

// Override the default icons for items.
Hooks.on("createItem", item => {
  let MYSTERY_MAN_ICON = "icons/svg/mystery-man.svg";

  let DEFAULT_GEAR_ICON = "icons/svg/chest.svg";
  let DEFAULT_WEAPON_ICON = "icons/svg/combat.svg";
  let DEFAULT_ARMOR_ICON = "icons/svg/statue.svg";
  let DEFAULT_MOVE_ICON = "icons/svg/book.svg";

  var newImg = DEFAULT_GEAR_ICON;
  if (item.type === "weapon") {
    newImg = DEFAULT_WEAPON_ICON;
  }
  else if (item.type === "armor") {
    newImg = DEFAULT_ARMOR_ICON;
  }
  else if (item.type === "move") {
    newImg = DEFAULT_MOVE_ICON;
  }

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
		getTemplate("systems/monsterweek/templates/actor-sheet.html"),
		getTemplate("systems/monsterweek/templates/item-sheet.html"),
	]);
});