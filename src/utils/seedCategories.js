import prisma from "../../prisma/index.js";
import { generateSlug } from "./validation.js";

const defaultCategories = [
  {
    name: "Electronics",
    description: "Electronic devices and gadgets",
    children: [
      { name: "Mobile Phones", description: "Smartphones and accessories" },
      {
        name: "Laptops & Computers",
        description: "Laptops, desktops, and computer accessories",
      },
      {
        name: "Audio & Headphones",
        description: "Speakers, headphones, and audio equipment",
      },
      {
        name: "Cameras",
        description: "Digital cameras and photography equipment",
      },
      { name: "Gaming", description: "Gaming consoles and accessories" },
    ],
  },
  {
    name: "Fashion",
    description: "Clothing and fashion accessories",
    children: [
      { name: "Men's Clothing", description: "Men's fashion and apparel" },
      { name: "Women's Clothing", description: "Women's fashion and apparel" },
      { name: "Shoes", description: "Footwear for all occasions" },
      { name: "Accessories", description: "Fashion accessories and jewelry" },
      { name: "Bags", description: "Handbags, backpacks, and luggage" },
    ],
  },
  {
    name: "Home & Garden",
    description: "Home improvement and garden supplies",
    children: [
      { name: "Furniture", description: "Home and office furniture" },
      {
        name: "Kitchen & Dining",
        description: "Kitchenware and dining essentials",
      },
      {
        name: "Home Decor",
        description: "Decorative items and home accessories",
      },
      {
        name: "Garden & Outdoor",
        description: "Gardening tools and outdoor equipment",
      },
      {
        name: "Lighting",
        description: "Indoor and outdoor lighting solutions",
      },
    ],
  },
  {
    name: "Health & Beauty",
    description: "Health and beauty products",
    children: [
      { name: "Skincare", description: "Skincare products and treatments" },
      { name: "Makeup", description: "Cosmetics and makeup products" },
      {
        name: "Health Supplements",
        description: "Vitamins and health supplements",
      },
      {
        name: "Personal Care",
        description: "Personal hygiene and care products",
      },
      {
        name: "Fitness Equipment",
        description: "Home fitness and exercise equipment",
      },
    ],
  },
  {
    name: "Sports & Outdoors",
    description: "Sports and outdoor activities",
    children: [
      {
        name: "Exercise & Fitness",
        description: "Fitness equipment and accessories",
      },
      {
        name: "Sports Apparel",
        description: "Athletic clothing and sportswear",
      },
      {
        name: "Outdoor Gear",
        description: "Camping, hiking, and outdoor equipment",
      },
      { name: "Team Sports", description: "Equipment for team sports" },
      {
        name: "Water Sports",
        description: "Swimming and water sports equipment",
      },
    ],
  },
  {
    name: "Books & Media",
    description: "Books, movies, and digital media",
    children: [
      { name: "Books", description: "Physical and digital books" },
      {
        name: "Movies & TV",
        description: "DVDs, Blu-rays, and digital movies",
      },
      { name: "Music", description: "CDs, vinyl records, and digital music" },
      { name: "Games", description: "Board games, puzzles, and toys" },
      { name: "Educational", description: "Educational materials and courses" },
    ],
  },
  {
    name: "Automotive",
    description: "Car parts and automotive accessories",
    children: [
      {
        name: "Car Electronics",
        description: "Car audio, navigation, and electronics",
      },
      {
        name: "Car Care",
        description: "Car cleaning and maintenance products",
      },
      { name: "Accessories", description: "Car accessories and decorations" },
      {
        name: "Parts & Tools",
        description: "Replacement parts and automotive tools",
      },
      { name: "Motorcycle", description: "Motorcycle parts and accessories" },
    ],
  },
];

export const seedCategories = async () => {
  try {
    console.log("🌱 Starting category seeding...");

    // Check if categories already exist
    const existingCategories = await prisma.category.count();
    if (existingCategories > 0) {
      console.log("📋 Categories already exist, skipping seeding");
      return;
    }

    let totalCreated = 0;

    for (const categoryData of defaultCategories) {
      // Create parent category
      const parentSlug = generateSlug(categoryData.name);

      const parentCategory = await prisma.category.create({
        data: {
          name: categoryData.name,
          description: categoryData.description,
          slug: parentSlug,
          isActive: true,
          sortOrder: totalCreated,
        },
      });

      console.log(`✅ Created parent category: ${parentCategory.name}`);
      totalCreated++;

      // Create child categories
      if (categoryData.children && categoryData.children.length > 0) {
        for (let i = 0; i < categoryData.children.length; i++) {
          const childData = categoryData.children[i];
          const childSlug = generateSlug(childData.name);

          const childCategory = await prisma.category.create({
            data: {
              name: childData.name,
              description: childData.description,
              slug: childSlug,
              parentId: parentCategory.id,
              isActive: true,
              sortOrder: i,
            },
          });

          console.log(`  ✅ Created child category: ${childCategory.name}`);
          totalCreated++;
        }
      }
    }

    console.log(`🎉 Successfully seeded ${totalCreated} categories!`);

    // Display category tree
    const categoryTree = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    console.log("\n📊 Category Tree:");
    categoryTree.forEach((parent) => {
      console.log(
        `├── ${parent.name} (${parent.children.length} subcategories)`
      );
      parent.children.forEach((child, index) => {
        const isLast = index === parent.children.length - 1;
        console.log(`${isLast ? "└──" : "├──"}     ${child.name}`);
      });
    });
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
};

// Script to run seeding independently
export const runSeed = async () => {
  try {
    await seedCategories();
    console.log("✨ Seeding completed successfully!");
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed();
}
