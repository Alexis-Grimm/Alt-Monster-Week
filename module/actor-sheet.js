/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["monsterweek", "sheet", "actor"],
  	  template: "systems/monsterweek/templates/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "moves"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    // Split the Hunter's items into groups.
    if (this.actor.data.type == 'hunter') {
      this._prepareHunterItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for Hunter sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareHunterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const weapons = [];
    const armor = [];
    const gear = [];
    const moves = [];

    // Iterate through items, allocating to containers
    for (let i of sheetData.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      else if (i.type === 'armor') {
        armor.push(i);
      }
      else if (i.type === 'gear') {
        gear.push(i);
      }
      else if (i.type === 'move') {
        moves.push(i);
      }
    }

    // TODO: Sort each list by name

    actorData.weapons = weapons;
    actorData.armor = armor;
    actorData.gear = gear;
    actorData.moves = moves;
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Handle rollable attributes.
    html.find('.items .rollable').click(ev => {
      let button = $(ev.currentTarget);
      let r = new Roll(button.data('roll'), this.actor.getRollData());
      const li = button.parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      r.roll().toMessage({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
      });
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options={}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {
    // TODO: Lets us intercept edits before sending to server?

    // Update the Actor
    return this.object.update(formData);
  }
}
