import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storage = await AsyncStorage.getItem('@GoMarketplace:products');

      if (storage) {
        setProducts([...JSON.parse(storage)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const incrementedProducts = products.map(product => {
        if (product.id === id) {
          const incrementedProduct = product;

          incrementedProduct.quantity += 1;

          return incrementedProduct;
        }

        return product;
      });

      setProducts(incrementedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const decrementedProducts = products
        .filter(product => !(product.id === id && product.quantity === 1))
        .map(product => {
          const returnProduct = product;

          if (returnProduct.id === id) {
            returnProduct.quantity -= 1;
          }

          return returnProduct;
        });

      setProducts(decrementedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const [existentProduct] = products.filter(p => p.id === product.id);

      if (existentProduct) {
        increment(existentProduct.id);
        return;
      }

      setProducts([...products, { ...product, quantity: 1 }]);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [increment, products, setProducts],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
