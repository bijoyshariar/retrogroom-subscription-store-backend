import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import Order from "./orderModel";
import Product from "../product/productModel";
import { config } from "../../src/config";
import crypto from "crypto";
import { createCheckout, verifyPayment, validateWebhook } from "../../src/services/uddoktapayService";
const SSLCommerzPayment = require("sslcommerz-lts");

interface AuthRequest extends Request {
  user?: any;
}

const updateProductStock = async (orderedProducts: any, next: NextFunction) => {
  for (const orderedProduct of orderedProducts) {
    const product = await Product.findById(orderedProduct.product);
    if (!product) {
      return next(
        createHttpError(
          404,
          `Product with ID ${orderedProduct.product} not found`,
        ),
      );
    }

    // Skip stock update for digital products (no stock defined)
    if (!product.productStock || product.productStock.length === 0) {
      // Digital product — just increment sold count
      product.totalSoldProduct += orderedProduct.quantity;
      await product.save();
      continue;
    }

    const productStock = product.productStock.find(
      (stock) =>
        stock.color === orderedProduct.color &&
        stock.size === orderedProduct.size,
    );

    if (productStock) {
      if (productStock.quantity < orderedProduct.quantity) {
        return next(
          createHttpError(
            400,
            `Insufficient stock for product ${product.productName}, color: ${orderedProduct.color}, size: ${orderedProduct.size}. Available: ${productStock.quantity}, Requested: ${orderedProduct.quantity}`,
          ),
        );
      }

      productStock.quantity -= orderedProduct.quantity;
      product.totalSoldProduct += orderedProduct.quantity;
      await product.save();
    } else {
      // No matching stock entry but stock exists — skip silently for digital
      product.totalSoldProduct += orderedProduct.quantity;
      await product.save();
    }
  }
};

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { products, paymentMethod } = req.body;
  try {
    // Validate input
    if (!products || !paymentMethod) {
      return next(createHttpError(400, "All fields are required"));
    }

    // Create new order
    const newOrder = new Order({
      user: req.user._id,
      products,
      shipmentAddress: req.user.shipmentAddress,
      city: req.user.city,
      state: req.user.state,
      zip: req.user.zipcode,
      paymentMethod,
      totalAmount: 0, // Calculate total amount later
      status: "PENDING", // default status
    });

    // Calculate total amount
    let totalAmount = 0;
    let productName: string[] = [];

    for (const orderedProduct of products) {
      const product = await Product.findById(orderedProduct.product);

      if (!product) {
        return next(
          createHttpError(
            404,
            `Product with ID ${orderedProduct.product} not found`,
          ),
        );
      }

      // Digital products: use variant price or base price, skip stock check
      if (orderedProduct.variantId) {
        const variant = product.productVariants.find(
          (v: any) => v._id.toString() === orderedProduct.variantId,
        );
        if (variant) {
          totalAmount += (variant.salePrice || variant.price) * orderedProduct.quantity;
          productName.push(`${product.productName} (${variant.name})`);
        } else {
          totalAmount += (product.productSalePrice || product.productPrice) * orderedProduct.quantity;
          productName.push(product.productName);
        }
      } else if (product.productStock.length > 0 && orderedProduct.color && orderedProduct.size) {
        // Physical product with stock: check stock availability
        const productStock = product.productStock.find(
          (stock) =>
            stock.color === orderedProduct.color &&
            stock.size === orderedProduct.size,
        );

        if (productStock) {
          if (productStock.quantity < orderedProduct.quantity) {
            return next(
              createHttpError(
                400,
                `Insufficient stock for product ${product.productName}, color: ${orderedProduct.color}, size: ${orderedProduct.size}. Available: ${productStock.quantity}, Requested: ${orderedProduct.quantity}`,
              ),
            );
          }
          totalAmount += product.productPrice * orderedProduct.quantity;
          productName.push(
            `${product.productName} ${orderedProduct.size} ${orderedProduct.color}`,
          );
        } else {
          return next(
            createHttpError(
              400,
              `Product stock for color: ${orderedProduct.color}, size: ${orderedProduct.size} not found`,
            ),
          );
        }
      } else {
        // Digital product without variant: use sale price or base price
        totalAmount += (product.productSalePrice || product.productPrice) * orderedProduct.quantity;
        productName.push(product.productName);
      }
    }

    newOrder.totalAmount = totalAmount;

    // Save order to the database
    if (paymentMethod === "COD") {
      await updateProductStock(products, next);
      await newOrder.save();

      const order = await Order.findById(newOrder._id);
      const productss = order?.products;

      let orderProductId: String[] = [];
      let productId: any = [];
      productss?.forEach((item) => {
        orderProductId.push(item._id);
        productId.push(item.product);
      });

      return res
        .status(201)
        .json({
          orderProductId,
          newOrder: newOrder._id,
          productId: productId,
          message: "Order created successfully.",
        });
    } else if (paymentMethod === "SSLCOMMERZ") {
      await newOrder.save();
      const tranId = crypto.randomBytes(16).toString("hex");
      const data = {
        total_amount: newOrder.totalAmount,
        currency: "BDT",
        tran_id: tranId,
        success_url: `${config.root}/api/order/ssl-payment-success/${newOrder._id}`,
        fail_url: `${config.root}/api/order/ssl-payment-fail/${newOrder._id}`,
        cancel_url: `${config.root}/api/order/ssl-payment-cancel/${newOrder._id}`,
        shipping_method: "Courier",
        product_name: productName.join(", "),
        product_category: "Cloth",
        product_profile: "general",
        cus_name: req.user.userName,
        cus_email: req.user.email,
        cus_add1: req.user.shipmentAddress,
        cus_add2: "",
        cus_city: req.user.city,
        cus_state: req.user.state,
        cus_postcode: req.user.zipcode,
        cus_country: "Bangladesh",
        cus_phone: req.user.mobile,
        cus_fax: "",
        ipn_url: `${config.root}/api/order/ssl-payment-notification`,
        ship_name: req.user.userName,
        ship_add1: req.user.shipmentAddress,
        ship_city: req.user.city,
        ship_state: req.user.state,
        ship_postcode: req.user.zipcode,
        ship_country: "Bangladesh",
      };

      const sslCommerce = new SSLCommerzPayment(
        config.storeId,
        config.storeSecret,
        false,
      );
      sslCommerce
        .init(data)
        .then((apiResponse: any) => {
          let GatewayPageURL = apiResponse.GatewayPageURL;
          res.status(200).json({ url: GatewayPageURL });
        })
        .catch((err: any) => {
          return next(createHttpError(500, `SSLCommerz error: ${err.message}`));
        });
    } else if (paymentMethod === "UDDOKTAPAY") {
      await newOrder.save();
      try {
        const paymentUrl = await createCheckout({
          fullName: req.user.userName,
          email: req.user.email,
          amount: newOrder.totalAmount,
          metadata: { order_id: newOrder._id.toString() },
          redirectUrl: `${config.root}/api/order/uddoktapay-verify`,
          cancelUrl: `${config.root}/api/order/uddoktapay-cancel/${newOrder._id}`,
          webhookUrl: `${config.root}/api/order/uddoktapay-webhook`,
        });
        res.status(200).json({ url: paymentUrl });
      } catch (err: any) {
        return next(createHttpError(500, `UddoktaPay error: ${err.message}`));
      }
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

export const sslPaymentSuccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(createHttpError(404, `Order with ID ${id} not found`));
  }

  try {
    await updateProductStock(order.products, next);
    res.status(200).json({ message: `${id} payment successfully.` });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

export const sslPaymentCancelled = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(createHttpError(404, `Order with ID ${id} not found`));
  }

  try {
    await order.deleteOne();
    res.status(200).json({ message: `${id} payment cancelled successfully.` });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};
export const sslPaymentFailure = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return next(createHttpError(404, `Order with ID ${id} not found`));
  }

  try {
    await order.deleteOne();
    res.status(200).json({ message: `${id} payment Failed successfully.` });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//get All Order
export const allOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

//get user order
export const allUserOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user.id;
  try {
    const orders = await Order.find({ user: userId });
    res.status(200).json(orders);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return next(createHttpError(404, `Order with ID ${id} not found`));
  }

  order.status = status;
  if (status === "DELIVERED") {
    order.deliveredAt = new Date();
  }
  await order.save();

  res
    .status(200)
    .json({ message: `${id} status ${status} updated successfully.` });
};

// Admin: Assign Credentials to Order
export const assignCredentials = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const { email, password, renewDate, notes, deliveryMethod } = req.body;

  if (!email || !password) {
    return next(createHttpError(400, "Credential email and password are required"));
  }

  try {
    const order = await Order.findById(id).populate("user", "whatsappNumber userName");
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    order.credentials = {
      email,
      password,
      renewDate: renewDate ? new Date(renewDate) : null,
      notes: notes || "",
    };
    order.status = "DELIVERED";
    order.deliveredAt = new Date();
    order.deliveryMethod = deliveryMethod || "DASHBOARD";

    await order.save();

    res.status(200).json({
      order,
      message: `Credentials assigned and order marked as delivered via ${order.deliveryMethod}`,
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Mark Order as Active (subscription running)
export const markOrderActive = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    order.status = "ACTIVE";
    await order.save();

    res.status(200).json({ order, message: "Order marked as active" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Admin: Mark Order as Expired
export const markOrderExpired = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    order.status = "EXPIRED";
    await order.save();

    res.status(200).json({ order, message: "Order marked as expired" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Customer: Request Renewal
export const requestRenewal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const { orderId } = req.body;
  const userId = req.user._id;

  try {
    const originalOrder = await Order.findOne({ _id: orderId, user: userId });
    if (!originalOrder) {
      return next(createHttpError(404, "Order not found"));
    }

    if (!["ACTIVE", "EXPIRED"].includes(originalOrder.status)) {
      return next(createHttpError(400, "Can only renew active or expired subscriptions"));
    }

    // Create a new renewal order
    const renewalOrder = new Order({
      user: userId,
      products: originalOrder.products,
      totalAmount: originalOrder.totalAmount,
      paymentMethod: originalOrder.paymentMethod,
      status: "PENDING",
      isRenewal: true,
      originalOrder: originalOrder._id,
    });

    await renewalOrder.save();

    res.status(201).json({
      renewalOrder,
      message: "Renewal order created. Please proceed with payment.",
    });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// Customer: Get My Subscriptions (Active/Expired orders with credentials)
export const getMySubscriptions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user._id;

  try {
    const subscriptions = await Order.find({
      user: userId,
      status: { $in: ["DELIVERED", "ACTIVE", "EXPIRED"] },
    })
      .populate("products.product", "productName productImage productSlug")
      .sort({ createdAt: -1 });

    res.status(200).json(subscriptions);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// UddoktaPay: Verify Payment (redirect callback)
export const uddoktapayVerify = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const invoiceId = req.query.invoice_id as string;

  if (!invoiceId) {
    return next(createHttpError(400, "Missing invoice_id"));
  }

  try {
    const paymentData = await verifyPayment(invoiceId);

    if (paymentData.status === "COMPLETED") {
      const orderId = paymentData.metadata?.order_id;
      const order = await Order.findById(orderId);

      if (!order) {
        return next(createHttpError(404, "Order not found"));
      }

      order.status = "PAID";
      order.transectionId = paymentData.transaction_id;
      await updateProductStock(order.products, next);
      await order.save();

      // Redirect to frontend success page
      res.redirect(`${config.frontendUrl}/checkout/success?order=${order.orderNumber}`);
    } else {
      res.redirect(`${config.frontendUrl}/checkout/failed`);
    }
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// UddoktaPay: Cancel Payment
export const uddoktapayCancel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (order) {
      await order.deleteOne();
    }
    res.redirect(`${config.frontendUrl}/checkout/cancelled`);
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};

// UddoktaPay: Webhook (IPN)
export const uddoktapayWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["rt-uddoktapay-api-key"] as string;

  if (!validateWebhook(apiKey)) {
    return res.status(401).json({ message: "Unauthorized webhook" });
  }

  try {
    const { status, metadata, transaction_id } = req.body;

    if (status === "COMPLETED" && metadata?.order_id) {
      const order = await Order.findById(metadata.order_id);
      if (order && order.status === "PENDING") {
        order.status = "PAID";
        order.transectionId = transaction_id;
        await updateProductStock(order.products, next);
        await order.save();
      }
    }

    res.status(200).json({ message: "Webhook processed" });
  } catch (err: any) {
    return next(createHttpError(500, err.message));
  }
};
