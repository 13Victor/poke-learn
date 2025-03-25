const ItemAbility = ({ item, ability, onChange }) => {
  return (
    <div className="item-abilityContainer">
      <div className="itemContainer">
        <img
          className="small-icon"
          src="https://images.wikidexcdn.net/mwuploads/wikidex/b/be/latest/20230122140856/Banda_aguante_EP.png"
          alt="Item"
        />
        <input type="text" name="item" value={item} onChange={onChange} />
      </div>
      <input
        type="text"
        name="ability"
        className="abilityInput"
        value={ability}
        onChange={onChange}
      />
    </div>
  );
};

export default ItemAbility;
