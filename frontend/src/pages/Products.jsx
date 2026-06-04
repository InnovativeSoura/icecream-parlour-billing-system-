import ProductCard from "../components/ProductCard";

const Products = () => {
  const products = [
    {
      _id: 1,
      name: "Chocolate Cone",
      category: "Cone",
      price: 50,
      image:
        "https://images.unsplash.com/photo-1563805042-7684c019e1cb",
    },
    {
      _id: 2,
      name: "Vanilla Cup",
      category: "Cup",
      price: 40,
      image:
        "https://images.unsplash.com/photo-1570197788417-0e82375c9371",
    },
    {
      _id: 3,
      name: "Strawberry Sundae",
      category: "Sundae",
      price: 120,
      image:
        "https://images.unsplash.com/photo-1579954115545-a95591f28bfc",
    },
  ];

  const addToCart = (product) => {
    alert(`${product.name} Added To Cart`);
  };

  return (
    <div>
      <h1
        style={{
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        🍨 Products
      </h1>

      <div className="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            addToCart={addToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default Products;