import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for order status
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing', 
  'shipped',
  'delivered',
  'cancelled'
]);

// Separate schema definitions from relations
// This resolves the circular dependency for 'categories'

// Users table (simplified - no teams/subscriptions)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('customer'), // customer, admin
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('US'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Categories for industrial supplies
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  parentId: integer('parent_id'), // Removed .references() here
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Products table for industrial supplies
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  description: text('description'),
  shortDescription: text('short_description'),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  categoryId: integer('category_id').notNull(), // Removed .references() here
  
  // Industrial supply specific fields
  material: varchar('material', { length: 100 }), // Steel, Stainless Steel, Brass, etc.
  finish: varchar('finish', { length: 100 }), // Zinc Plated, Black Oxide, etc.
  threadSize: varchar('thread_size', { length: 50 }), // M6, 1/4-20, etc.
  length: varchar('length', { length: 50 }), // 25mm, 1", etc.
  diameter: varchar('diameter', { length: 50 }), // 6mm, 1/4", etc.
  headType: varchar('head_type', { length: 100 }), // Phillips, Hex, Socket, etc.
  grade: varchar('grade', { length: 50 }), // Grade 8, A2, etc.
  
  // Inventory & Status
  stockQuantity: integer('stock_quantity').default(0),
  lowStockThreshold: integer('low_stock_threshold').default(10),
  weight: decimal('weight', { precision: 8, scale: 3 }), // in pounds
  dimensions: varchar('dimensions', { length: 100 }), // L x W x H
  
  // SEO & Meta
  metaTitle: varchar('meta_title', { length: 200 }),
  metaDescription: text('meta_description'),
  
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Product images
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(), // Removed .references() here
  imageUrl: text('image_url').notNull(),
  altText: varchar('alt_text', { length: 200 }),
  sortOrder: integer('sort_order').default(0),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Shopping cart
export const carts = pgTable('carts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'), // Removed .references() here
  sessionId: varchar('session_id', { length: 255 }), // for guest users
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Cart items
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cartId: integer('cart_id').notNull(), // Removed .references() here
  productId: integer('product_id').notNull(), // Removed .references() here
  quantity: integer('quantity').notNull().default(1),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Price at time of adding to cart
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Orders
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
  userId: integer('user_id'), // Removed .references() here
  
  // Customer info (stored for historical purposes)
  customerName: varchar('customer_name', { length: 200 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }),
  
  // Shipping address
  shippingAddress: text('shipping_address').notNull(),
  shippingCity: varchar('shipping_city', { length: 100 }).notNull(),
  shippingState: varchar('shipping_state', { length: 100 }).notNull(),
  shippingZipCode: varchar('shipping_zip_code', { length: 20 }).notNull(),
  shippingCountry: varchar('shipping_country', { length: 100 }).notNull(),
  
  // Billing address (can be same as shipping)
  billingAddress: text('billing_address').notNull(),
  billingCity: varchar('billing_city', { length: 100 }).notNull(),
  billingState: varchar('billing_state', { length: 100 }).notNull(),
  billingZipCode: varchar('billing_zip_code', { length: 20 }).notNull(),
  billingCountry: varchar('billing_country', { length: 100 }).notNull(),
  
  // Order totals
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  
  // Payment & Status
  status: orderStatusEnum('status').notNull().default('pending'),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSessionId: text('stripe_session_id'),
  
  // Tracking
  trackingNumber: varchar('tracking_number', { length: 100 }),
  shippingCarrier: varchar('shipping_carrier', { length: 100 }),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Order items
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(), // Removed .references() here
  productId: integer('product_id').notNull(), // Removed .references() here
  
  // Product details at time of order (for historical accuracy)
  productName: varchar('product_name', { length: 200 }).notNull(),
  productSku: varchar('product_sku', { length: 100 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  
  // Product specifications at time of order
  material: varchar('material', { length: 100 }),
  finish: varchar('finish', { length: 100 }),
  threadSize: varchar('thread_size', { length: 50 }),
  length: varchar('length', { length: 50 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'CategoryParent',
  }),
  children: many(categories, {
    relationName: 'CategoryParent',
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  carts: many(carts),
  orders: many(orders),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// Complex types
export type ProductWithImages = Product & {
  images: ProductImage[];
  category: Category;
};

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
  })[];
};

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
  })[];
};

// Safe user type (excludes sensitive fields like passwordHash)
export type SafeUser = Omit<User, 'passwordHash'>;

// Or be more explicit about what we include:
export type SessionUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};
