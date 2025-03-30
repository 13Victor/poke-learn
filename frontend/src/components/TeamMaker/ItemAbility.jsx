const ItemAbility = ({ item, ability, onChange }) => {
  return (
    <div className="item-abilityContainer">
      <div className="itemContainer">
        <img
          className="small-icon"
          src="https://img.freepik.com/psd-premium/mariposa-colorida-es-realista-aislada-archivo-png-fondo-transparente_1304044-3907.jpg?semt=ais_hybrid"
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
