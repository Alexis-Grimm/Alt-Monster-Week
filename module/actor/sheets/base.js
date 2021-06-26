/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MotwActorSheet extends ActorSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
  	  classes: ["monsterweek", "sheet", "actor"],
  	  template: "systems/monsterweek/templates/actors/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [
        {
          navSelector: ".tab-nav-left",
          contentSelector: ".tab-content-left",
          initial: "moves",
        },
        {
          navSelector: ".tab-nav-right",
          contentSelector: ".tab-content-right",
          initial: "gear",
        },
      ],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();

    if (this.actor.data.type == 'hunter') {
      this._prepareHunterRatings(data);
      this._prepareHunterItems(data);
    }
    //console.log(data);
    return data;
  }

  /**
   * Adds '+' in front of positive ratings.
   *
   * @param {Object} sheetData The sheet containing the actor to prepare.
   */
  _prepareHunterRatings(sheetData) {
    let ratings = sheetData.actor.data.data.ratings;
    for (let key in ratings) {
      if (ratings.hasOwnProperty(key)) {
        let rating = ratings[key];

        if (rating.hasOwnProperty("value") && rating.value > 0) {
          rating.value = rating.value;
        }

      }
    }
  }

  /**
   * Organize and classify Items for Hunter sheets.
   *
   * @param {Object} sheetData The sheet containing the actor to prepare.
   *
   * @return {undefined}
   */
  _prepareHunterItems(sheetData) {
    const actorData = sheetData.actor;

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

    actorData.moves = moves;
    actorData.allGear = [
      // Labels must correspond to MOTW.${label} localizable strings.
      {"label": "Weapons", "items": weapons},
      {"label": "Armor", "items": armor},
      {"label": "Gear", "items": gear},
    ];
  }

  /* -------------------------------------------- */

  /**
   * Handles rolling a rating like "Cool" when clicking on its name.
   * @private
   */
  _onRatingRoll(ev) {
    let button = $(ev.currentTarget);
    let r = new Roll(button.data('roll'), this.actor.getRollData()).roll();

    var tier;
    if (r.total >= 10) {
      tier = game.i18n.localize("MOTW.TotalSuccess");
    } else if (r.total >= 7) {
      tier = game.i18n.localize("MOTW.MixedSuccess");
    } else {
      tier = game.i18n.localize("MOTW.Failure");
    }

    r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${button.text()}</h2><i>${tier}</i>`
    });
  }

  /* -------------------------------------------- */

  /**
   * Shows/hides item (move/gear/etc.) summaries when clicking on item names.
   * @private
   */
  _onItemNameClick(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents(".item");
    let item = this.actor.items.get(li.data("item-id"));

    // Toggle summary
    if (li.hasClass("item-expanded")) {
      let summary = li.children(".item-summary");
      summary.slideUp(200, () => summary.remove());
    } else {
      let div = $(`<div class="item-summary">${item.data.data.description}</div>`);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("item-expanded");
  }

  /* -------------------------------------------- */

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    if (this.actor.isOwner) {
      // Roll when clicking the name of a rating.
      html.find('.rating .rollable').click(ev => this._onRatingRoll(ev));
    }

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Handle clicks on "track" elements and update the underlying values.
    html.find(".track-element").click(ev => {
      const valueName = $(ev.currentTarget).parents(".track").data("valueName");
      const delta = ev.currentTarget.classList.contains("marked") ? -1 : 1;
      this.actor.modifyValue(valueName, delta);
    });

    // Handle clicks on track icons and update the underlying values.
    html.find(".rating-icon").click(ev => {
      const dataType = ev.currentTarget.getAttribute("data");
      let valueName;
      let delta;
      switch (dataType) {
        case 'ApplyHarm':
          valueName = "harm"; delta = -1; break;
        case 'HealHarm':
          valueName = "harm"; delta = 1; break;
        case 'BadLuck':
          valueName = "luck"; delta = -1; break;
        case 'GoodLuck':
          valueName = "luck"; delta = 1; break;
        case 'Forget':
          valueName = "experience"; delta = -1; break;
        case 'Learn':
          valueName = "experience"; delta = 1; break;
      }
      //const delta;
      this.actor.modifyValue(valueName, delta);
    });

    // Show/hide item (move/gear/etc) summaries when clicking on item names.
    html.find('.item-list .item .item-name').click(ev => this._onItemNameClick(ev));

    // Add Inventory Item
    html.find('.item-create').click(ev => {
      ev.preventDefault();

      // TODO: Consolidate this with the similar list in simple.js.
      const DEFAULT_MOVE_ICON = "icons/svg/book.svg"
      const DEFAULT_GEAR_ICON = "icons/svg/chest.svg";
      const DEFAULT_WEAPON_ICON = "icons/svg/combat.svg";
      const DEFAULT_ARMOR_ICON = "icons/svg/statue.svg";

      // The incoming type will be a localization key like "Moves", but
      // we need an item type like "move".
      const headerType = $(ev.currentTarget).data("type");
      const entry = {
        Moves: { type: "move", img: DEFAULT_MOVE_ICON },
        Weapons: { type: "weapon", img: DEFAULT_WEAPON_ICON },
        Armor: { type: "armor", img: DEFAULT_ARMOR_ICON },
        Gear: { type: "gear", img: DEFAULT_GEAR_ICON },
      }[headerType];

      const itemData = {
        name: game.i18n.format("MOTW.NewItem"),
        type: entry.type,
        img: entry.img,
        data: {},
      };
      return this.actor.createEmbeddedDocuments("Item", [itemData]);
    });

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) return item.delete();
      li.slideUp(200, () => this.render(false));
    });
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Called when the sheet window is moved or resized.
   */
  setPosition(options={}) {
    const position = super.setPosition(options);

    // Let any tab bodies know that the viewport has changed.
    const tabBodies = this.element.find(".tab-content .tab");
    if (tabBodies.length > 0) {
      // See how much of the window height belongs to the tabs. Assumes that all
      // tab bodies have the same y position.
      //
      // Use the `offsetTop` of the tab body's parent element (typically a div
      // that contains all bodies for the tab group) in case tab body zero is
      // currently hidden. Note that this offset is relative to `this.element`
      // since we looked up the tab using `this.element.find`.
      const tabHeight = position.height - tabBodies[0].parentElement.offsetTop;
      tabBodies.css("height", tabHeight);
    }

    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {
    // Lets us intercept edits before sending to the server.
    // formData contains name/value pairs from <input> elements etc. in the form.

    // Update the Actor
    return this.object.update(formData);
  }
}
