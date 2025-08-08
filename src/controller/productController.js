import prisma from "../../prisma/index.js";
import {
  validateRequiredFields,
  validatePrice,
  validateStock,
  validateSku,
  validateProductStatus,
  generateSlug,
} from "../utils/validation.js";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PRODUCT_STATUS,
} from "../constants/validation.js";

export const createProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      categoryId,
      name,
      description,
      price,
      comparePrice,
      costPrice,
      sku,
      stock,
      lowStockThreshold,
      trackInventory,
      images,
      featuredImage,
      metaTitle,
      metaDescription,
      tags,
      weight,
      dimensions,
    } = req.body;

    const fieldsValidation = validateRequiredFields(req.body, [
      "categoryId",
      "name",
      "description",
      "price",
    ]);
    if (!fieldsValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: fieldsValidation.message,
      });
    }

    const priceValidation = validatePrice(price);
    if (!priceValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: priceValidation.message,
      });
    }

    if (comparePrice) {
      const comparePriceValidation = validatePrice(comparePrice);
      if (!comparePriceValidation.isValid) {
        return res.status(400).json({
          status: "error",
          message: "Invalid compare price format",
        });
      }
    }

    const stockValue = stock || 0;
    const stockValidation = validateStock(stockValue);
    if (!stockValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: stockValidation.message,
      });
    }

    if (sku) {
      const skuValidation = validateSku(sku);
      if (!skuValidation.isValid) {
        return res.status(400).json({
          status: "error",
          message: skuValidation.message,
        });
      }

      const existingSku = await prisma.product.findFirst({
        where: {
          vendorId,
          sku: sku.trim().toUpperCase(),
        },
      });

      if (existingSku) {
        return res.status(400).json({
          status: "error",
          message: "SKU already exists for your products",
        });
      }
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or inactive category",
      });
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        vendorId,
        name: name.trim(),
      },
    });

    if (existingProduct) {
      return res.status(400).json({
        status: "error",
        message: "Product with this name already exists",
      });
    }

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const product = await prisma.product.create({
      data: {
        vendorId,
        categoryId,
        name: name.trim(),
        description: description.trim(),
        slug,
        sku: sku?.trim().toUpperCase() || null,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: parseInt(stockValue),
        lowStockThreshold: lowStockThreshold || 5,
        trackInventory: trackInventory !== false,
        images: images || [],
        featuredImage,
        metaTitle,
        metaDescription,
        tags: tags || [],
        weight: weight ? parseFloat(weight) : null,
        dimensions,
        status: PRODUCT_STATUS.DRAFT,
        adminApproved: false,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            storeName: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: "success",
      data: product,
      message: SUCCESS_MESSAGES.PRODUCT_CREATED,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Vendor: Get own products
export const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      categoryId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { vendorId };

    if (status && Object.values(PRODUCT_STATUS).includes(status)) {
      whereClause.status = status;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get vendor products error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Public: Get all active products
export const getPublicProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      categoryId,
      vendorId,
      search,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
      featured,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {
      isActive: true,
      adminApproved: true,
      status: PRODUCT_STATUS.ACTIVE,
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (vendorId) {
      whereClause.vendorId = vendorId;
    }

    if (featured === "true") {
      whereClause.isFeatured = true;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          vendor: {
            select: {
              id: true,
              storeName: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get public products error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Public: Get single product
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeInactive } = req.query;

    const whereClause = { id };

    if (!includeInactive) {
      whereClause.isActive = true;
      whereClause.adminApproved = true;
      whereClause.status = PRODUCT_STATUS.ACTIVE;
    }

    const product = await prisma.product.findUnique({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        vendor: {
          select: {
            id: true,
            storeName: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    return res.status(200).json({
      status: "success",
      data: product,
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get product error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Vendor: Update own product
export const updateProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    if (existingProduct.vendorId !== vendorId) {
      return res.status(403).json({
        status: "error",
        message: ERROR_MESSAGES.PRODUCT_NOT_YOURS,
      });
    }

    const fieldsToUpdate = {};

    if (updateData.price !== undefined) {
      const priceValidation = validatePrice(updateData.price);
      if (!priceValidation.isValid) {
        return res.status(400).json({
          status: "error",
          message: priceValidation.message,
        });
      }
      fieldsToUpdate.price = parseFloat(updateData.price);
    }

    if (updateData.comparePrice !== undefined) {
      if (updateData.comparePrice) {
        const comparePriceValidation = validatePrice(updateData.comparePrice);
        if (!comparePriceValidation.isValid) {
          return res.status(400).json({
            status: "error",
            message: "Invalid compare price format",
          });
        }
        fieldsToUpdate.comparePrice = parseFloat(updateData.comparePrice);
      } else {
        fieldsToUpdate.comparePrice = null;
      }
    }

    if (updateData.stock !== undefined) {
      const stockValidation = validateStock(updateData.stock);
      if (!stockValidation.isValid) {
        return res.status(400).json({
          status: "error",
          message: stockValidation.message,
        });
      }
      fieldsToUpdate.stock = parseInt(updateData.stock);
    }

    if (updateData.sku !== undefined) {
      if (updateData.sku) {
        const skuValidation = validateSku(updateData.sku);
        if (!skuValidation.isValid) {
          return res.status(400).json({
            status: "error",
            message: skuValidation.message,
          });
        }

        const existingSku = await prisma.product.findFirst({
          where: {
            vendorId,
            sku: updateData.sku.trim().toUpperCase(),
            id: { not: id },
          },
        });

        if (existingSku) {
          return res.status(400).json({
            status: "error",
            message: "SKU already exists for your products",
          });
        }

        fieldsToUpdate.sku = updateData.sku.trim().toUpperCase();
      } else {
        fieldsToUpdate.sku = null;
      }
    }

    if (updateData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updateData.categoryId },
      });

      if (!category || !category.isActive) {
        return res.status(400).json({
          status: "error",
          message: "Invalid or inactive category",
        });
      }

      fieldsToUpdate.categoryId = updateData.categoryId;
    }

    if (updateData.name && updateData.name.trim() !== existingProduct.name) {
      const existingName = await prisma.product.findFirst({
        where: {
          vendorId,
          name: updateData.name.trim(),
          id: { not: id },
        },
      });

      if (existingName) {
        return res.status(400).json({
          status: "error",
          message: "Product with this name already exists",
        });
      }

      fieldsToUpdate.name = updateData.name.trim();

      const baseSlug = generateSlug(updateData.name);
      let slug = baseSlug;
      let counter = 1;

      while (
        await prisma.product.findFirst({
          where: { slug, id: { not: id } },
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      fieldsToUpdate.slug = slug;
    }

    const simpleFields = [
      "description",
      "costPrice",
      "lowStockThreshold",
      "trackInventory",
      "images",
      "featuredImage",
      "metaTitle",
      "metaDescription",
      "tags",
      "weight",
      "dimensions",
      "isFeatured",
    ];

    simpleFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "costPrice" || field === "weight") {
          fieldsToUpdate[field] = updateData[field]
            ? parseFloat(updateData[field])
            : null;
        } else if (field === "lowStockThreshold") {
          fieldsToUpdate[field] = parseInt(updateData[field]) || 5;
        } else {
          fieldsToUpdate[field] = updateData[field];
        }
      }
    });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: fieldsToUpdate,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            storeName: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      data: updatedProduct,
      message: SUCCESS_MESSAGES.PRODUCT_UPDATED,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Vendor: Update product status
export const updateProductStatus = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const statusValidation = validateProductStatus(status);
    if (!statusValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: statusValidation.message,
      });
    }

    const allowedStatuses = [
      PRODUCT_STATUS.DRAFT,
      PRODUCT_STATUS.ACTIVE,
      PRODUCT_STATUS.INACTIVE,
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid status for vendor",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    if (existingProduct.vendorId !== vendorId) {
      return res.status(403).json({
        status: "error",
        message: ERROR_MESSAGES.PRODUCT_NOT_YOURS,
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      status: "success",
      data: updatedProduct,
      message: SUCCESS_MESSAGES.PRODUCT_STATUS_UPDATED,
    });
  } catch (error) {
    console.error("Update product status error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Vendor: Delete own product
export const deleteProduct = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    if (existingProduct.vendorId !== vendorId) {
      return res.status(403).json({
        status: "error",
        message: ERROR_MESSAGES.PRODUCT_NOT_YOURS,
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({
      status: "success",
      message: SUCCESS_MESSAGES.PRODUCT_DELETED,
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Vendor: Get low stock products
export const getLowStockProducts = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const allProducts = await prisma.product.findMany({
      where: {
        vendorId,
        trackInventory: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { stock: "asc" },
    });

    const lowStockProducts = allProducts.filter(
      (product) => product.stock <= product.lowStockThreshold
    );

    return res.status(200).json({
      status: "success",
      data: lowStockProducts,
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get low stock products error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Admin: Get all products
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      vendorId,
      categoryId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};

    if (status && Object.values(PRODUCT_STATUS).includes(status)) {
      whereClause.status = status;
    }

    if (vendorId) {
      whereClause.vendorId = vendorId;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              storeName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit)),
        },
      },
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get all products error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Admin: Approve/reject product
export const moderateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.PRODUCT_NOT_FOUND,
      });
    }

    let updateData = {};

    if (action === "approve") {
      updateData = {
        adminApproved: true,
        status: PRODUCT_STATUS.ACTIVE,
      };
    } else if (action === "reject") {
      updateData = {
        adminApproved: false,
        status: PRODUCT_STATUS.REJECTED,
      };
    } else {
      return res.status(400).json({
        status: "error",
        message: "Invalid action. Use 'approve' or 'reject'",
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true },
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            storeName: true,
          },
        },
      },
    });

    const message =
      action === "approve"
        ? SUCCESS_MESSAGES.PRODUCT_APPROVED
        : SUCCESS_MESSAGES.PRODUCT_REJECTED;

    return res.status(200).json({
      status: "success",
      data: updatedProduct,
      message,
    });
  } catch (error) {
    console.error("Moderate product error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
