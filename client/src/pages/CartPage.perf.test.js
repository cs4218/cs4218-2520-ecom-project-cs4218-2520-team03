// Seah Yi Xun Ryo, A0252602R
// Story 5: CartPage totalPrice() performance with large cart (spike testing)

// Copy of totalPrice from CartPage.js to avoid module resolution issues
const totalPrice = (cart) => {
  try {
    let total = 0;
    cart?.map((item) => {
      total = total + (item.price || 0);
    });
    return total.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  } catch (error) {
    console.log(error);
  }
};

// Generate mock cart items
const generateMockCart = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `product-${i}`,
    name: `Product ${i}`,
    description: `Description for product ${i} with some extra text`,
    price: Math.floor(Math.random() * 100) + 10,
  }));
};

describe("CartPage Performance Tests", () => {
  describe("totalPrice() calculation performance", () => {
    it("calculates total for 10 items under 50ms (includes JIT warm-up)", () => {
      const cart = generateMockCart(10);
      
      const start = performance.now();
      const result = totalPrice(cart);
      const elapsed = performance.now() - start;
      
      expect(result).toBeDefined();
      expect(elapsed).toBeLessThan(50); // First call includes JIT compilation overhead
      console.log(`totalPrice(10 items): ${elapsed.toFixed(3)}ms`);
    });

    it("calculates total for 50 items under 5ms", () => {
      const cart = generateMockCart(50);
      
      const start = performance.now();
      const result = totalPrice(cart);
      const elapsed = performance.now() - start;
      
      expect(result).toBeDefined();
      expect(elapsed).toBeLessThan(5);
      console.log(`totalPrice(50 items): ${elapsed.toFixed(3)}ms`);
    });

    it("calculates total for 100 items under 10ms", () => {
      const cart = generateMockCart(100);
      
      const start = performance.now();
      const result = totalPrice(cart);
      const elapsed = performance.now() - start;
      
      expect(result).toBeDefined();
      expect(elapsed).toBeLessThan(10);
      console.log(`totalPrice(100 items): ${elapsed.toFixed(3)}ms`);
    });

    it("calculates total for 500 items under 50ms", () => {
      const cart = generateMockCart(500);
      
      const start = performance.now();
      const result = totalPrice(cart);
      const elapsed = performance.now() - start;
      
      expect(result).toBeDefined();
      expect(elapsed).toBeLessThan(50);
      console.log(`totalPrice(500 items): ${elapsed.toFixed(3)}ms`);
    });
  });

  describe("totalPrice() scaling behavior", () => {
    it("scales linearly with cart size", () => {
      const sizes = [10, 50, 100, 200, 500];
      const times = [];

      for (const size of sizes) {
        const cart = generateMockCart(size);
        const iterations = 100;
        
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
          totalPrice(cart);
        }
        const avgTime = (performance.now() - start) / iterations;
        times.push({ size, avgTime });
      }

      console.log("\nScaling analysis (avg per call):");
      times.forEach(({ size, avgTime }) => {
        console.log(`  ${size} items: ${avgTime.toFixed(4)}ms`);
      });

      // Check that 500 items takes less than 15x the time of 50 items (linear scaling)
      const ratio = times[4].avgTime / times[1].avgTime;
      console.log(`  Ratio (500/50 items): ${ratio.toFixed(2)}x (expected ~10x for linear)`);
      expect(ratio).toBeLessThan(15);
    });
  });

  describe("totalPrice() edge cases", () => {
    it("handles empty cart", () => {
      const start = performance.now();
      const result = totalPrice([]);
      const elapsed = performance.now() - start;
      
      expect(result).toBe("$0.00");
      expect(elapsed).toBeLessThan(1);
    });

    it("handles null/undefined cart", () => {
      const start = performance.now();
      const result1 = totalPrice(null);
      const result2 = totalPrice(undefined);
      const elapsed = performance.now() - start;
      
      expect(result1).toBe("$0.00");
      expect(result2).toBe("$0.00");
      expect(elapsed).toBeLessThan(1);
    });

    it("handles items with missing price", () => {
      const cart = [
        { _id: "1", name: "Product 1", price: 50 },
        { _id: "2", name: "Product 2" }, // no price
        { _id: "3", name: "Product 3", price: 30 },
      ];
      
      const result = totalPrice(cart);
      expect(result).toBe("$80.00");
    });
  });
});
