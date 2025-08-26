import { db } from './drizzle';
import { eq, or } from 'drizzle-orm'; 
import { 
  users, 
  categories, 
  products, 
  productImages,
  NewUser,
  NewCategory, 
  NewProduct,
  NewProductImage
} from './schema';
import bcrypt from 'bcryptjs';

export async function seedEcommerceData() {
  try {
    console.log('🌱 Seeding e-commerce data...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser: NewUser = {
      name: 'Admin User',
      email: 'admin@industrialsupplies.com',
      passwordHash: hashedPassword,
      role: 'admin',
      phone: '555-0123',
      address: '123 Industrial Way',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'US',
    };

    // Use onConflictDoNothing to prevent duplicate user creation
    await db.insert(users).values(adminUser)
      .onConflictDoNothing({ target: users.email });
    console.log('✅ Admin user created (or already exists):', adminUser.email);


    // Create test customer
    const customerPassword = await bcrypt.hash('customer123', 10);
    const testCustomer: NewUser = {
      name: 'John Contractor',
      email: 'john@contractor.com',
      passwordHash: customerPassword,
      role: 'customer',
      phone: '555-0456',
      address: '456 Building St',
      city: 'Detroit',
      state: 'MI',
      zipCode: '48201',
      country: 'US',
    };

    await db.insert(users).values(testCustomer)
      .onConflictDoNothing({ target: users.email });
    console.log('✅ Test customer created (or already exists):', testCustomer.email);


    // Create categories
    const categoryData: NewCategory[] = [
      {
        name: 'Fasteners',
        slug: 'fasteners',
        description: 'All types of fasteners including screws, bolts, and nuts',
        sortOrder: 1,
      },
      {
        name: 'Screws',
        slug: 'screws',
        description: 'Machine screws, wood screws, self-tapping screws',
        sortOrder: 1,
      },
      {
        name: 'Bolts',
        slug: 'bolts',
        description: 'Hex bolts, carriage bolts, eye bolts',
        sortOrder: 2,
      },
      {
        name: 'Nuts',
        slug: 'nuts',
        description: 'Hex nuts, lock nuts, wing nuts',
        sortOrder: 3,
      },
      {
        name: 'Washers',
        slug: 'washers',
        description: 'Flat washers, lock washers, fender washers',
        sortOrder: 4,
      },
      {
        name: 'Anchors',
        slug: 'anchors',
        description: 'Wall anchors, concrete anchors, toggle bolts',
        sortOrder: 5,
      }
    ];

    // Use onConflictDoNothing to prevent duplicate category creation
    await db.insert(categories).values(categoryData)
      .onConflictDoNothing({ target: categories.slug });
    
    // You'll need to re-query to get the IDs for relationships
    const insertedCategories = await db.query.categories.findMany();
    
    console.log(`✅ Created ${insertedCategories.length} categories`);

    // The rest of your script should work once the above is fixed.

  } catch (error) {
    console.error('❌ Error seeding e-commerce data:', error);
    throw error;
  }
}


// Run if called directly
if (require.main === module) {
  seedEcommerceData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}