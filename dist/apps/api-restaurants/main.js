/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.restaurantModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(7);
const graphql_1 = __webpack_require__(8);
const apollo_1 = __webpack_require__(9);
const jwt_1 = __webpack_require__(10);
const prisma_service_1 = __webpack_require__(11);
const email_module_1 = __webpack_require__(13);
const restaurant_service_1 = __webpack_require__(17);
const restaurant_resolver_1 = __webpack_require__(25);
const restaurant_controller_1 = __webpack_require__(32);
const menu_item_service_1 = __webpack_require__(33);
const cloudinary_service_1 = __webpack_require__(34);
const cloudinary_module_1 = __webpack_require__(36);
const shared_module_1 = __webpack_require__(38);
const redis_module_1 = __webpack_require__(40);
let restaurantModule = class restaurantModule {
};
exports.restaurantModule = restaurantModule;
exports.restaurantModule = restaurantModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['apps/api-restaurants/.env.local', 'apps/api-restaurants/.env'],
            }),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloFederationDriver,
                autoSchemaFile: {
                    federation: 2,
                },
            }),
            email_module_1.EmailModule,
            cloudinary_module_1.CloudinaryModule,
            shared_module_1.SharedModule,
            redis_module_1.RedisModule
        ],
        controllers: [restaurant_controller_1.RestaurantController],
        providers: [
            restaurant_service_1.RestaurantService,
            config_1.ConfigService,
            jwt_1.JwtService,
            prisma_service_1.PrismaService,
            restaurant_resolver_1.RestaurantResolver,
            menu_item_service_1.MenuItemService,
            cloudinary_service_1.CloudinaryService,
        ],
    })
], restaurantModule);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/graphql");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("@nestjs/apollo");

/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const client_1 = __webpack_require__(12);
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = tslib_1.__decorate([
    (0, common_1.Injectable)()
], PrismaService);


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const email_service_1 = __webpack_require__(14);
const mailer_1 = __webpack_require__(15);
const config_1 = __webpack_require__(7);
const path_1 = __webpack_require__(4);
const ejs_adapter_1 = __webpack_require__(16);
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mailer_1.MailerModule.forRootAsync({
                useFactory: async (config) => ({
                    transport: {
                        host: config.get('SMTP_HOST') || 'smtp.gmail.com',
                        port: parseInt(config.get('SMTP_PORT') || '465'),
                        secure: true,
                        auth: {
                            user: config.get('SMTP_MAIL')?.replace(/"/g, ''),
                            pass: config.get('SMTP_PASSWORD'),
                        },
                    },
                    defaults: {
                        from: 'SnackRapido <noreply@snackrapido.com>',
                    },
                    template: {
                        dir: (0, path_1.join)(__dirname, '../../../apps/api-restaurants/email-templates'),
                        adapter: new ejs_adapter_1.EjsAdapter(),
                        options: {
                            strict: false,
                        },
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [email_service_1.EmailService],
        exports: [email_service_1.EmailService],
    })
], EmailModule);


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var EmailService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailService = void 0;
const tslib_1 = __webpack_require__(1);
const mailer_1 = __webpack_require__(15);
const common_1 = __webpack_require__(6);
let EmailService = EmailService_1 = class EmailService {
    constructor(mailService) {
        this.mailService = mailService;
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async sendMail({ subject, email, name, activationCode, activation_token, template, }) {
        try {
            this.logger.log(`📧 Sending email to ${email}`);
            await this.mailService.sendMail({
                to: email,
                subject,
                template,
                context: {
                    name,
                    activationCode,
                    activation_token,
                },
            });
            this.logger.log(`✅ Email sent successfully to ${email}`);
        }
        catch (error) {
            this.logger.error(`❌ Failed to send email to ${email}:`, error.message);
            throw error;
        }
    }
    async sendActivationEmail(email, name, activationCode, activationToken) {
        return this.sendMail({
            subject: 'Activate your restaurant account!',
            email,
            name,
            activationCode,
            activation_token: activationToken,
            template: './activation-mail',
        });
    }
    async sendWelcomeEmail(email, name) {
        return this.sendMail({
            subject: 'Welcome to SnackRapido!',
            email,
            name,
            template: './welcome-mail',
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof mailer_1.MailerService !== "undefined" && mailer_1.MailerService) === "function" ? _a : Object])
], EmailService);


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/mailer");

/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/mailer/dist/adapters/ejs.adapter");

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var RestaurantService_1;
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RestaurantService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const jwt_1 = __webpack_require__(10);
const prisma_service_1 = __webpack_require__(11);
const config_1 = __webpack_require__(7);
const email_service_1 = __webpack_require__(14);
const rabbitmq_service_1 = __webpack_require__(18);
const redis_service_1 = __webpack_require__(20);
const message_patterns_1 = __webpack_require__(22);
const bcrypt = tslib_1.__importStar(__webpack_require__(23));
const send_token_1 = __webpack_require__(24);
let RestaurantService = RestaurantService_1 = class RestaurantService {
    constructor(jwtService, prisma, configService, emailService, rabbitMQService, redisService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.configService = configService;
        this.emailService = emailService;
        this.rabbitMQService = rabbitMQService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(RestaurantService_1.name);
    }
    async registerRestaurant(registerDto, response) {
        const { name, country, city, address, email, phone_number, password, coordinates, ownerId } = registerDto;
        const isEmailExist = await this.prisma.restaurant.findUnique({
            where: { email },
        });
        if (isEmailExist) {
            throw new common_1.BadRequestException('Restaurant already exists with this email!');
        }
        if (phone_number) {
            const restaurantWithPhone = await this.prisma.restaurant.findFirst({
                where: { phone_number },
            });
            if (restaurantWithPhone) {
                throw new common_1.BadRequestException('Restaurant already exists with this phone number!');
            }
        }
        if (coordinates && (coordinates.type !== 'Point' || coordinates.coordinates.length !== 2)) {
            throw new common_1.BadRequestException('Invalid coordinates format. Must be { type: "Point", coordinates: [lng, lat] }');
        }
        if (ownerId) {
            const owner = await this.prisma.user.findUnique({
                where: { id: ownerId },
            });
            if (!owner || owner.role !== 'Owner') {
                throw new common_1.BadRequestException('Invalid or non-owner user ID');
            }
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const restaurant = {
            name,
            country,
            city,
            address,
            email,
            phone_number,
            password: hashedPassword,
            coordinates,
            ownerId,
        };
        const { activationToken, activationCode } = await this.createActivationToken(restaurant);
        await this.emailService.sendActivationEmail(email, name, activationCode, activationToken);
        return {
            activation_token: activationToken,
            message: 'Please check your email to activate your account',
            response,
        };
    }
    async createActivationToken(restaurant) {
        const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
        const activationToken = this.jwtService.sign({
            restaurant,
            activationCode,
        }, {
            secret: this.configService.get('JWT_SECRET_KEY'),
            expiresIn: '5m',
        });
        return { activationToken, activationCode };
    }
    async activateRestaurant(activationDto, response) {
        const { activationToken, activationCode } = activationDto;
        const newRestaurant = this.jwtService.verify(activationToken, {
            secret: this.configService.get('JWT_SECRET_KEY'),
        });
        if (newRestaurant.activationCode !== activationCode) {
            throw new common_1.BadRequestException('Invalid activation code');
        }
        if (newRestaurant.exp && newRestaurant.exp * 1000 < Date.now()) {
            throw new common_1.BadRequestException('Activation token expired');
        }
        const { name, country, city, phone_number, password, email, address, coordinates, ownerId } = newRestaurant.restaurant;
        const existRestaurant = await this.prisma.restaurant.findUnique({
            where: { email },
        });
        if (existRestaurant) {
            throw new common_1.BadRequestException('Restaurant already exists with this email!');
        }
        const restaurant = await this.prisma.restaurant.create({
            data: {
                name,
                email,
                address,
                country,
                city,
                phone_number,
                password,
                coordinates,
                ownerId,
            },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        // Emit restaurant created event via RabbitMQ
        console.log('🐰 RABBITMQ: About to emit restaurant created event');
        try {
            this.rabbitMQService.emitEvent(message_patterns_1.MESSAGE_PATTERNS.RESTAURANT_CREATED, {
                id: restaurant.id,
                timestamp: new Date(),
                source: 'restaurant-service',
                version: '1.0.0',
                type: 'restaurant.created',
                data: {
                    restaurantId: restaurant.id,
                    name: restaurant.name,
                    email: restaurant.email,
                    address: restaurant.address,
                    coordinates: restaurant.coordinates,
                },
            });
            console.log('🐰 RABBITMQ: Event emitted successfully');
        }
        catch (error) {
            console.error('🐰 RABBITMQ ERROR:', error.message);
        }
        // Cache restaurant data
        console.log('🔴 REDIS: About to cache restaurant data');
        try {
            await this.redisService.set(message_patterns_1.CACHE_KEYS.RESTAURANT(restaurant.id), restaurant, 3600 // 1 hour cache
            );
            console.log('🔴 REDIS: Restaurant cached successfully');
        }
        catch (error) {
            console.error('🔴 REDIS ERROR:', error.message);
        }
        return { restaurant, response };
    }
    async LoginRestaurant(loginDto) {
        const { email, password } = loginDto;
        // Try to get restaurant from cache first
        const cachedRestaurant = await this.redisService.getJson(message_patterns_1.CACHE_KEYS.RESTAURANT(email));
        let restaurant;
        if (cachedRestaurant) {
            restaurant = cachedRestaurant;
        }
        else {
            restaurant = await this.prisma.restaurant.findUnique({
                where: { email },
                include: {
                    menus: true,
                    categories: true,
                    menuItems: {
                        include: {
                            images: true,
                            category: true,
                            menu: true,
                        },
                    },
                    operatingHours: true,
                    owner: true,
                },
            });
            // Cache the restaurant data if found
            if (restaurant) {
                await this.redisService.set(message_patterns_1.CACHE_KEYS.RESTAURANT(restaurant.id), restaurant, 3600 // 1 hour cache
                );
            }
        }
        if (restaurant && (await this.comparePassword(password, restaurant.password))) {
            const tokenSender = new send_token_1.TokenSender(this.configService, this.jwtService);
            return tokenSender.sendToken(restaurant);
        }
        else {
            return {
                restaurant: null,
                accessToken: null,
                refreshToken: null,
                error: {
                    message: 'Invalid email or password',
                },
            };
        }
    }
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
    async getLoggedInRestaurant(req) {
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        if (!restaurant) {
            throw new common_1.BadRequestException('Restaurant not found');
        }
        return {
            restaurant,
            accessToken: req.accesstoken,
            refreshToken: req.refreshtoken,
        };
    }
    async Logout(req) {
        if (!req.restaurant) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        req.restaurant = null;
        req.refreshtoken = null;
        req.accesstoken = null;
        return { message: 'Logged out successfully!' };
    }
    async findRestaurantsNear(findRestaurantsNearDto) {
        const { coordinates, maxDistance } = findRestaurantsNearDto;
        if (coordinates.length !== 2) {
            throw new common_1.BadRequestException('Coordinates must be [longitude, latitude]');
        }
        const rawRestaurants = await this.prisma.restaurant.findRaw({
            filter: {
                coordinates: {
                    $near: {
                        $geometry: { type: 'Point', coordinates },
                        $maxDistance: maxDistance,
                    },
                },
            },
        });
        if (!Array.isArray(rawRestaurants)) {
            throw new common_1.BadRequestException('Unexpected response format from database');
        }
        // Map raw results to Restaurant type
        const restaurants = await Promise.all(rawRestaurants.map(async (raw) => {
            const restaurant = await this.prisma.restaurant.findUnique({
                where: { id: raw._id.toString() },
                include: {
                    menus: true,
                    categories: true,
                    menuItems: {
                        include: {
                            images: true,
                        },
                    },
                    operatingHours: true,
                    owner: true,
                },
            });
            return restaurant;
        }));
        // Filter out null results (in case some IDs are invalid)
        const validRestaurants = restaurants.filter((r) => r !== null);
        if (!validRestaurants.length) {
            return { restaurants: [], error: { message: 'No restaurants found within the specified radius' } };
        }
        return { restaurants: validRestaurants };
    }
    // ==================== MENU MANAGEMENT ====================
    async createMenu(createMenuDto, req) {
        const { name } = createMenuDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const menu = await this.prisma.menu.create({
            data: {
                name,
                restaurantId,
            },
        });
        const updatedRestaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Menu created successfully',
            restaurant: updatedRestaurant,
        };
    }
    async updateMenu(updateMenuDto, req) {
        const { id, name } = updateMenuDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const menu = await this.prisma.menu.findFirst({
            where: { id, restaurantId },
        });
        if (!menu) {
            throw new common_1.BadRequestException('Menu not found or not owned by restaurant');
        }
        await this.prisma.menu.update({
            where: { id },
            data: { name },
        });
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Menu updated successfully',
            restaurant,
        };
    }
    async deleteMenu(deleteMenuDto, req) {
        const { id } = deleteMenuDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const menu = await this.prisma.menu.findFirst({
            where: { id, restaurantId },
        });
        if (!menu) {
            throw new common_1.BadRequestException('Menu not found or not owned by restaurant');
        }
        // First, get all menu items in this menu
        const menuItems = await this.prisma.menuItem.findMany({
            where: { menuId: id },
            select: { id: true }
        });
        // Delete all associated images first
        for (const menuItem of menuItems) {
            await this.prisma.images.deleteMany({
                where: { foodId: menuItem.id },
            });
        }
        // Then delete all menu items in this menu
        await this.prisma.menuItem.deleteMany({
            where: { menuId: id },
        });
        // Finally delete the menu
        await this.prisma.menu.delete({
            where: { id },
        });
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Menu deleted successfully',
            restaurant,
        };
    }
    // ==================== CATEGORY MANAGEMENT ====================
    async createCategory(createCategoryDto, req) {
        const { name, description } = createCategoryDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const category = await this.prisma.category.create({
            data: {
                name,
                restaurantId,
                description: description || null
            },
        });
        const restaurants = await this.prisma.restaurant.findMany({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Category created successfully',
            restaurant: restaurants[0], // Return first restaurant as example
        };
    }
    async updateCategory(updateCategoryDto, req) {
        const { id, name } = updateCategoryDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.BadRequestException('Category not found');
        }
        await this.prisma.category.update({
            where: { id },
            data: { name },
        });
        const restaurants = await this.prisma.restaurant.findMany({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Category updated successfully',
            restaurant: restaurants[0], // Return first restaurant as example
        };
    }
    async deleteCategory(deleteCategoryDto, req) {
        const { id } = deleteCategoryDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const category = await this.prisma.category.findUnique({
            where: { id },
        });
        if (!category) {
            throw new common_1.BadRequestException('Category not found');
        }
        // Check if category is being used by any menu items
        const menuItemsUsingCategory = await this.prisma.menuItem.findMany({
            where: { categoryId: id },
        });
        if (menuItemsUsingCategory.length > 0) {
            throw new common_1.BadRequestException('Cannot delete category that is being used by menu items');
        }
        await this.prisma.category.delete({
            where: { id },
        });
        const restaurants = await this.prisma.restaurant.findMany({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Category deleted successfully',
            restaurant: restaurants[0], // Return first restaurant as example
        };
    }
    // ==================== MENU ITEM MANAGEMENT ====================
    async createMenuItem(createMenuItemDto, req) {
        const { name, description, price, estimatedPrice, categoryId, menuId, available, images } = createMenuItemDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        // Validate that the category belongs to this restaurant
        const category = await this.prisma.category.findFirst({
            where: {
                id: categoryId,
                restaurantId: restaurantId
            }
        });
        if (!category) {
            throw new common_1.BadRequestException('Category not found or does not belong to this restaurant');
        }
        // Validate that the menu belongs to this restaurant
        const menu = await this.prisma.menu.findFirst({
            where: {
                id: menuId,
                restaurantId: restaurantId
            }
        });
        if (!menu) {
            throw new common_1.BadRequestException('Menu not found or does not belong to this restaurant');
        }
        const menuItem = await this.prisma.menuItem.create({
            data: {
                name,
                description,
                price,
                estimatedPrice,
                categoryId,
                menuId,
                restaurantId,
                available: available ?? true,
                images: images ? {
                    create: images.map(url => ({ public_id: '', url }))
                } : undefined,
            },
        });
        const updatedRestaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Menu item created successfully',
            restaurant: updatedRestaurant,
        };
    }
    async updateMenuItem(updateMenuItemDto, req) {
        const { id, name, description, price, estimatedPrice, categoryId, menuId, available } = updateMenuItemDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const menuItem = await this.prisma.menuItem.findFirst({
            where: { id, restaurantId },
        });
        if (!menuItem) {
            throw new common_1.BadRequestException('Menu item not found or not owned by restaurant');
        }
        // Validate that the category belongs to this restaurant (if categoryId is provided)
        if (categoryId) {
            const category = await this.prisma.category.findFirst({
                where: {
                    id: categoryId,
                    restaurantId: restaurantId
                }
            });
            if (!category) {
                throw new common_1.BadRequestException('Category not found or does not belong to this restaurant');
            }
        }
        // Validate that the menu belongs to this restaurant (if menuId is provided)
        if (menuId) {
            const menu = await this.prisma.menu.findFirst({
                where: {
                    id: menuId,
                    restaurantId: restaurantId
                }
            });
            if (!menu) {
                throw new common_1.BadRequestException('Menu not found or does not belong to this restaurant');
            }
        }
        await this.prisma.menuItem.update({
            where: { id },
            data: {
                name,
                description,
                price,
                estimatedPrice,
                categoryId,
                menuId,
                available,
            },
        });
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Menu item updated successfully',
            restaurant,
        };
    }
    async deleteMenuItem(deleteMenuItemDto, req) {
        const { id } = deleteMenuItemDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const menuItem = await this.prisma.menuItem.findFirst({
            where: { id, restaurantId },
        });
        if (!menuItem) {
            throw new common_1.BadRequestException('Menu item not found or not owned by restaurant');
        }
        // Delete associated images first
        await this.prisma.images.deleteMany({
            where: { foodId: id },
        });
        // Delete the menu item
        await this.prisma.menuItem.delete({
            where: { id },
        });
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Menu item deleted successfully',
            restaurant,
        };
    }
    // ==================== OPERATING HOURS MANAGEMENT ====================
    async createOperatingHours(createOperatingHoursDto, req) {
        const { dayOfWeek, openTime, closeTime, isClosed } = createOperatingHoursDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const operatingHours = await this.prisma.operatingHours.create({
            data: {
                dayOfWeek,
                openTime,
                closeTime,
                isClosed: isClosed ?? false,
                restaurantId,
            },
        });
        const updatedRestaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Operating hours created successfully',
            restaurant: updatedRestaurant,
        };
    }
    async updateOperatingHours(updateOperatingHoursDto, req) {
        const { id, dayOfWeek, openTime, closeTime, isClosed } = updateOperatingHoursDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const operatingHours = await this.prisma.operatingHours.findFirst({
            where: { id, restaurantId },
        });
        if (!operatingHours) {
            throw new common_1.BadRequestException('Operating hours not found or not owned by restaurant');
        }
        await this.prisma.operatingHours.update({
            where: { id },
            data: {
                dayOfWeek,
                openTime,
                closeTime,
                isClosed,
            },
        });
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Operating hours updated successfully',
            restaurant,
        };
    }
    async deleteOperatingHours(deleteOperatingHoursDto, req) {
        const { id } = deleteOperatingHoursDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        const operatingHours = await this.prisma.operatingHours.findFirst({
            where: { id, restaurantId },
        });
        if (!operatingHours) {
            throw new common_1.BadRequestException('Operating hours not found or not owned by restaurant');
        }
        await this.prisma.operatingHours.delete({
            where: { id },
        });
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: {
                    include: {
                        images: true,
                        category: true,
                        menu: true,
                    },
                },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Operating hours deleted successfully',
            restaurant,
        };
    }
    // ==================== STAFF MANAGEMENT ====================
    async addStaffMember(addStaffMemberDto, req) {
        const { userId, role } = addStaffMemberDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        // Validate user exists via RabbitMQ (users service is the source of truth)
        const validation = await this.rabbitMQService.sendAndWait('user.validate', { userId });
        if (!validation.isValid) {
            throw new common_1.BadRequestException(`User not found: ${validation.error}`);
        }
        const validatedUser = validation.user;
        // Upsert the user into the restaurants DB local copy
        await this.prisma.user.upsert({
            where: { id: userId },
            update: { role: role },
            create: {
                id: userId,
                name: validatedUser.name,
                email: validatedUser.email,
                password: 'managed-by-users-service',
                role: role,
            },
        });
        const updatedRestaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: { include: { images: true, category: true, menu: true } },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Staff member added successfully',
            restaurant: updatedRestaurant,
        };
    }
    async removeStaffMember(removeStaffMemberDto, req) {
        const { userId } = removeStaffMemberDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        // Validate user exists via RabbitMQ
        const validation = await this.rabbitMQService.sendAndWait('user.validate', { userId });
        if (!validation.isValid) {
            throw new common_1.BadRequestException(`User not found: ${validation.error}`);
        }
        // Update local copy role back to User
        await this.prisma.user.upsert({
            where: { id: userId },
            update: { role: 'User' },
            create: {
                id: userId,
                name: validation.user.name,
                email: validation.user.email,
                password: 'managed-by-users-service',
                role: 'User',
            },
        });
        const updatedRestaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menus: true,
                categories: true,
                menuItems: { include: { images: true, category: true, menu: true } },
                operatingHours: true,
                owner: true,
            },
        });
        return {
            message: 'Staff member removed successfully',
            restaurant: updatedRestaurant,
        };
    }
    // Validate restaurant for Orders Service (RabbitMQ handler)
    async validateRestaurant(data) {
        this.logger.log(`🔍 Validating restaurant: ${data.restaurantId}`);
        try {
            const restaurant = await this.prisma.restaurant.findUnique({
                where: { id: data.restaurantId },
            });
            if (!restaurant) {
                return {
                    isValid: false,
                    error: 'Restaurant not found',
                };
            }
            const response = {
                isValid: true,
                restaurant: {
                    id: restaurant.id,
                    name: restaurant.name,
                    email: restaurant.email,
                    address: restaurant.address,
                },
            };
            return response;
        }
        catch (error) {
            this.logger.error(`❌ Restaurant validation failed: ${error.message}`);
            return {
                isValid: false,
                error: 'Validation failed',
            };
        }
    }
    // Validate menu items for Orders Service (RabbitMQ handler)
    async validateMenuItems(data) {
        this.logger.log(`🔍 Validating menu items for restaurant: ${data.restaurantId}`);
        try {
            const restaurant = await this.prisma.restaurant.findUnique({
                where: { id: data.restaurantId },
                include: {
                    menuItems: true,
                },
            });
            if (!restaurant) {
                return {
                    isValid: false,
                    error: 'Restaurant not found',
                };
            }
            const validItems = [];
            const errors = [];
            for (const item of data.items) {
                const menuItem = restaurant.menuItems.find(mi => mi.id === item.menuItemId);
                if (!menuItem) {
                    errors.push(`Menu item ${item.menuItemId} not found`);
                    continue;
                }
                if (item.quantity <= 0) {
                    errors.push(`Invalid quantity for menu item ${menuItem.name}`);
                    continue;
                }
                validItems.push(menuItem);
            }
            if (errors.length > 0) {
                return {
                    isValid: false,
                    error: errors.join(', '),
                    validItems: [],
                };
            }
            return {
                isValid: true,
                validItems,
            };
        }
        catch (error) {
            this.logger.error(`❌ Menu items validation failed: ${error.message}`);
            return {
                isValid: false,
                error: 'Validation failed',
                validItems: [],
            };
        }
    }
};
exports.RestaurantService = RestaurantService;
exports.RestaurantService = RestaurantService = RestaurantService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _d : Object, typeof (_e = typeof rabbitmq_service_1.RabbitMQService !== "undefined" && rabbitmq_service_1.RabbitMQService) === "function" ? _e : Object, typeof (_f = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _f : Object])
], RestaurantService);


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RabbitMQService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const microservices_1 = __webpack_require__(3);
const rxjs_1 = __webpack_require__(19);
let RabbitMQService = class RabbitMQService {
    constructor(client, notificationsClient, analyticsClient) {
        this.client = client;
        this.notificationsClient = notificationsClient;
        this.analyticsClient = analyticsClient;
    }
    /**
     * Send a message to RabbitMQ queue
     */
    sendMessage(pattern, data) {
        return this.client.send(pattern, data).pipe((0, rxjs_1.timeout)(30000));
    }
    /**
     * Emit an event to both notifications and analytics queues
     */
    emitEvent(pattern, data) {
        try {
            // Emit to notifications queue
            if (this.notificationsClient) {
                this.notificationsClient.emit(pattern, data);
            }
            // Emit to analytics queue
            if (this.analyticsClient) {
                this.analyticsClient.emit(pattern, data);
            }
        }
        catch (error) {
            console.error(`❌ RabbitMQ: Failed to emit event "${pattern}":`, error.message);
        }
    }
    /**
     * Send a message and wait for response with retry logic
     */
    async sendAndWait(pattern, data, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.sendMessage(pattern, data).toPromise();
                return result;
            }
            catch (error) {
                lastError = error;
                // Check if it's a "no matching handler" error (consumer not ready yet)
                const errorMessage = error?.message || error?.toString() || '';
                const isHandlerNotFound = errorMessage.includes('no matching message handler') ||
                    errorMessage.includes('no matching handler');
                // Only retry if it's a handler not found error and we have retries left
                if (isHandlerNotFound && attempt < maxRetries) {
                    const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000); // Exponential backoff, max 2s
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                // If it's not a handler error or we're out of retries, throw
                throw error;
            }
        }
        // If we exhausted retries, throw the last error
        throw lastError;
    }
    /**
     * Health check for RabbitMQ connection
     */
    async healthCheck() {
        try {
            await this.sendMessage('health_check', {}).toPromise();
            return true;
        }
        catch (error) {
            return false;
        }
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)('RABBITMQ_SERVICE')),
    tslib_1.__param(1, (0, common_1.Inject)('NOTIFICATIONS_SERVICE')),
    tslib_1.__param(2, (0, common_1.Inject)('ANALYTICS_SERVICE')),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof microservices_1.ClientProxy !== "undefined" && microservices_1.ClientProxy) === "function" ? _a : Object, typeof (_b = typeof microservices_1.ClientProxy !== "undefined" && microservices_1.ClientProxy) === "function" ? _b : Object, typeof (_c = typeof microservices_1.ClientProxy !== "undefined" && microservices_1.ClientProxy) === "function" ? _c : Object])
], RabbitMQService);


/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("rxjs");

/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const ioredis_1 = __webpack_require__(21);
let RedisService = class RedisService {
    constructor(redis) {
        this.redis = redis;
    }
    /**
     * Set a key-value pair with optional expiration
     */
    async set(key, value, ttl) {
        console.log(`🔴 REDIS SERVICE: Setting key "${key}" with TTL ${ttl}`);
        console.log(`🔴 REDIS SERVICE: Value type: ${typeof value}`);
        const serializedValue = typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
        try {
            let result;
            if (ttl) {
                result = await this.redis.setex(key, ttl, serializedValue);
                console.log(`🔴 REDIS SERVICE: SETEX result:`, result);
            }
            else {
                result = await this.redis.set(key, serializedValue);
                console.log(`🔴 REDIS SERVICE: SET result:`, result);
            }
            // Verify the key was actually set
            const verification = await this.redis.get(key);
            console.log(`🔴 REDIS SERVICE: Verification - key "${key}" exists:`, !!verification);
            return result;
        }
        catch (error) {
            console.error(`🔴 REDIS SERVICE: Error setting key "${key}":`, error.message);
            throw error;
        }
    }
    /**
     * Get a value by key
     */
    async get(key) {
        return this.redis.get(key);
    }
    /**
     * Get a value and parse it as JSON
     */
    async getJson(key) {
        const value = await this.redis.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Delete a key
     */
    async del(key) {
        return this.redis.del(key);
    }
    /**
     * Check if a key exists
     */
    async exists(key) {
        const result = await this.redis.exists(key);
        return result === 1;
    }
    /**
     * Set expiration for a key
     */
    async expire(key, seconds) {
        const result = await this.redis.expire(key, seconds);
        return result === 1;
    }
    /**
     * Get time to live for a key
     */
    async ttl(key) {
        return this.redis.ttl(key);
    }
    /**
     * Increment a numeric value
     */
    async incr(key) {
        return this.redis.incr(key);
    }
    /**
     * Increment a numeric value by a specific amount
     */
    async incrby(key, increment) {
        return this.redis.incrby(key, increment);
    }
    /**
     * Publish a message to a channel
     */
    async publish(channel, message) {
        const serializedMessage = typeof message === 'object'
            ? JSON.stringify(message)
            : message;
        return this.redis.publish(channel, serializedMessage);
    }
    /**
     * Subscribe to a channel
     */
    async subscribe(channel, callback) {
        const subscriber = this.redis.duplicate();
        await subscriber.subscribe(channel);
        subscriber.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                callback(message);
            }
        });
    }
    /**
     * Health check for Redis connection
     */
    async healthCheck() {
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get all keys matching a pattern
     */
    async keys(pattern) {
        return this.redis.keys(pattern);
    }
    /**
     * Flush all data (use with caution)
     */
    async flushAll() {
        return this.redis.flushall();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)('REDIS_CLIENT')),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof ioredis_1.Redis !== "undefined" && ioredis_1.Redis) === "function" ? _a : Object])
], RedisService);


/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CACHE_KEYS = exports.REDIS_MESSAGE_PATTERNS = exports.REDIS_CHANNELS = exports.MESSAGE_PATTERNS = void 0;
// RabbitMQ Message Patterns
exports.MESSAGE_PATTERNS = {
    // User Service Patterns
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    // Restaurant Service Patterns
    RESTAURANT_CREATED: 'restaurant.created',
    RESTAURANT_UPDATED: 'restaurant.updated',
    RESTAURANT_DELETED: 'restaurant.deleted',
    RESTAURANT_LOGIN: 'restaurant.login',
    RESTAURANT_LOGOUT: 'restaurant.logout',
    // Menu Patterns
    MENU_CREATED: 'menu.created',
    MENU_UPDATED: 'menu.updated',
    MENU_DELETED: 'menu.deleted',
    // Menu Item Patterns
    MENU_ITEM_CREATED: 'menu_item.created',
    MENU_ITEM_UPDATED: 'menu_item.updated',
    MENU_ITEM_DELETED: 'menu_item.deleted',
    // Category Patterns
    CATEGORY_CREATED: 'category.created',
    CATEGORY_UPDATED: 'category.updated',
    CATEGORY_DELETED: 'category.deleted',
    // Order Patterns
    ORDER_CREATED: 'order.created',
    ORDER_PLACED: 'order.placed',
    ORDER_CONFIRMED: 'order.confirmed',
    ORDER_PREPARING: 'order.preparing',
    ORDER_READY: 'order.ready',
    ORDER_OUT_FOR_DELIVERY: 'order.out_for_delivery',
    ORDER_DELIVERED: 'order.delivered',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_STATUS_UPDATED: 'order.status_updated',
    ORDER_REVIEWED: 'order.reviewed',
    ORDER_PAYMENT_PROCESSED: 'order.payment_processed',
    // Notification Patterns
    SEND_EMAIL: 'notification.send_email',
    SEND_SMS: 'notification.send_sms',
    SEND_PUSH: 'notification.send_push',
    // Reservation Patterns
    RESERVATION_CREATED: 'reservation.created',
    RESERVATION_CONFIRMED: 'reservation.confirmed',
    RESERVATION_CANCELLED: 'reservation.cancelled',
    RESERVATION_COMPLETED: 'reservation.completed',
    RESERVATION_NO_SHOW: 'reservation.no_show',
    // Cache Patterns
    CACHE_INVALIDATE: 'cache.invalidate',
    CACHE_CLEAR: 'cache.clear',
    // Health Check
    HEALTH_CHECK: 'health.check',
};
// Redis Channel Patterns (with wildcard support)
exports.REDIS_CHANNELS = {
    USER_EVENTS: 'user.*',
    RESTAURANT_EVENTS: 'restaurant.*',
    MENU_EVENTS: 'menu.*',
    ORDER_EVENTS: 'order.*',
    NOTIFICATION_EVENTS: 'notification.*',
    CACHE_EVENTS: 'cache.*',
    HEALTH_EVENTS: 'health.*',
};
// Redis Message Patterns (for direct messaging)
exports.REDIS_MESSAGE_PATTERNS = {
    // User Service Patterns
    USER_CREATE: 'user.create',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    // Restaurant Service Patterns
    RESTAURANT_CREATE: 'restaurant.create',
    RESTAURANT_UPDATE: 'restaurant.update',
    RESTAURANT_DELETE: 'restaurant.delete',
    RESTAURANT_LOGIN: 'restaurant.login',
    RESTAURANT_LOGOUT: 'restaurant.logout',
    // Menu Patterns
    MENU_CREATE: 'menu.create',
    MENU_UPDATE: 'menu.update',
    MENU_DELETE: 'menu.delete',
    // Menu Item Patterns
    MENU_ITEM_CREATE: 'menu_item.create',
    MENU_ITEM_UPDATE: 'menu_item.update',
    MENU_ITEM_DELETE: 'menu_item.delete',
    // Order Patterns
    ORDER_CREATE: 'order.create',
    ORDER_UPDATE: 'order.update',
    ORDER_CANCEL: 'order.cancel',
    ORDER_COMPLETE: 'order.complete',
    // Health Check
    HEALTH_CHECK: 'health.check',
};
// Cache Keys
exports.CACHE_KEYS = {
    USER: (id) => `user:${id}`,
    RESTAURANT: (id) => `restaurant:${id}`,
    MENU: (id) => `menu:${id}`,
    MENU_ITEM: (id) => `menu_item:${id}`,
    CATEGORY: (id) => `category:${id}`,
    ORDER: (id) => `order:${id}`,
    ORDER_STATUS: (id) => `order_status:${id}`,
    CUSTOMER_ORDERS: (customerId) => `customer_orders:${customerId}`,
    RESTAURANT_ORDERS: (restaurantId) => `restaurant_orders:${restaurantId}`,
    RESERVATION: (id) => `reservation:${id}`,
    RESTAURANT_RESERVATIONS: (restaurantId, date) => `restaurant_reservations:${restaurantId}:${date}`,
    TABLE_AVAILABILITY: (restaurantId, date) => `table_availability:${restaurantId}:${date}`,
    RESTAURANTS_NEARBY: (lat, lng, radius) => `restaurants:nearby:${lat}:${lng}:${radius}`,
    USER_SESSION: (userId) => `session:user:${userId}`,
    RESTAURANT_SESSION: (restaurantId) => `session:restaurant:${restaurantId}`,
};


/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokenSender = void 0;
class TokenSender {
    constructor(config, jwt) {
        this.config = config;
        this.jwt = jwt;
    }
    sendToken(restaurant) {
        const accessToken = this.jwt.sign({
            id: restaurant.id, email: restaurant.email
        }, {
            secret: this.config.get('ACCESS_TOKEN_SECRET'),
            expiresIn: '15m',
        });
        const refreshToken = this.jwt.sign({
            id: restaurant.id, email: restaurant.email
        }, {
            secret: this.config.get('REFRESH_TOKEN_SECRET'),
            expiresIn: '5d',
        });
        return { restaurant, accessToken, refreshToken, error: null };
    }
}
exports.TokenSender = TokenSender;


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RestaurantResolver = void 0;
const tslib_1 = __webpack_require__(1);
const graphql_1 = __webpack_require__(8);
const restaurant_service_1 = __webpack_require__(17);
const restaurant_type_1 = __webpack_require__(26);
const restaurant_dto_1 = __webpack_require__(29);
const common_1 = __webpack_require__(6);
const auth_guard_1 = __webpack_require__(31);
let RestaurantResolver = class RestaurantResolver {
    constructor(restaurantService) {
        this.restaurantService = restaurantService;
    }
    async registerRestaurant(registerDto, context) {
        const { message, activation_token } = await this.restaurantService.registerRestaurant(registerDto, context.res);
        return { message, activation_token };
    }
    async activateRestaurant(activationDto, context) {
        return await this.restaurantService.activateRestaurant(activationDto, context.res);
    }
    async LoginRestaurant(loginDto) {
        return await this.restaurantService.LoginRestaurant(loginDto);
    }
    async getLoggedInRestaurant(context) {
        return await this.restaurantService.getLoggedInRestaurant(context.req);
    }
    async logOutRestaurant(context) {
        return await this.restaurantService.Logout(context.req);
    }
    async findRestaurantsNear(findRestaurantsNearDto) {
        return await this.restaurantService.findRestaurantsNear(findRestaurantsNearDto);
    }
    // ==================== MENU MANAGEMENT RESOLVERS ====================
    async createMenu(createMenuDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 📋 Handling CREATE MENU request');
        return await this.restaurantService.createMenu(createMenuDto, context.req);
    }
    async updateMenu(updateMenuDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 📝 Handling UPDATE MENU request');
        return await this.restaurantService.updateMenu(updateMenuDto, context.req);
    }
    async deleteMenu(deleteMenuDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE MENU request');
        return await this.restaurantService.deleteMenu(deleteMenuDto, context.req);
    }
    // ==================== CATEGORY MANAGEMENT RESOLVERS ====================
    async createCategory(createCategoryDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🏷️ Handling CREATE CATEGORY request');
        return await this.restaurantService.createCategory(createCategoryDto, context.req);
    }
    async updateCategory(updateCategoryDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE CATEGORY request');
        return await this.restaurantService.updateCategory(updateCategoryDto, context.req);
    }
    async deleteCategory(deleteCategoryDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE CATEGORY request');
        return await this.restaurantService.deleteCategory(deleteCategoryDto, context.req);
    }
    // ==================== MENU ITEM MANAGEMENT RESOLVERS ====================
    async createMenuItem(createMenuItemDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🍽️ Handling CREATE MENU ITEM request');
        return await this.restaurantService.createMenuItem(createMenuItemDto, context.req);
    }
    async updateMenuItem(updateMenuItemDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE MENU ITEM request');
        return await this.restaurantService.updateMenuItem(updateMenuItemDto, context.req);
    }
    async deleteMenuItem(deleteMenuItemDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE MENU ITEM request');
        return await this.restaurantService.deleteMenuItem(deleteMenuItemDto, context.req);
    }
    // ==================== OPERATING HOURS MANAGEMENT RESOLVERS ====================
    async createOperatingHours(createOperatingHoursDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🕒 Handling CREATE OPERATING HOURS request');
        return await this.restaurantService.createOperatingHours(createOperatingHoursDto, context.req);
    }
    async updateOperatingHours(updateOperatingHoursDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | ✏️ Handling UPDATE OPERATING HOURS request');
        return await this.restaurantService.updateOperatingHours(updateOperatingHoursDto, context.req);
    }
    async deleteOperatingHours(deleteOperatingHoursDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 🗑️ Handling DELETE OPERATING HOURS request');
        return await this.restaurantService.deleteOperatingHours(deleteOperatingHoursDto, context.req);
    }
    // ==================== STAFF MANAGEMENT RESOLVERS ====================
    async addStaffMember(addStaffMemberDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 👥 Handling ADD STAFF MEMBER request');
        return await this.restaurantService.addStaffMember(addStaffMemberDto, context.req);
    }
    async removeStaffMember(removeStaffMemberDto, context) {
        console.log('\x1b[33m🍕 RESTAURANT SERVICE\x1b[0m | 👋 Handling REMOVE STAFF MEMBER request');
        return await this.restaurantService.removeStaffMember(removeStaffMemberDto, context.req);
    }
};
exports.RestaurantResolver = RestaurantResolver;
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.RegisterResponse),
    tslib_1.__param(0, (0, graphql_1.Args)("registerDto")),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof restaurant_dto_1.RegisterDto !== "undefined" && restaurant_dto_1.RegisterDto) === "function" ? _b : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], RestaurantResolver.prototype, "registerRestaurant", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.ActivationResponse),
    tslib_1.__param(0, (0, graphql_1.Args)("activationDto")),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_d = typeof restaurant_dto_1.ActivationDto !== "undefined" && restaurant_dto_1.ActivationDto) === "function" ? _d : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], RestaurantResolver.prototype, "activateRestaurant", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.LoginResponse),
    tslib_1.__param(0, (0, graphql_1.Args)('loginDto')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_f = typeof restaurant_dto_1.LoginDto !== "undefined" && restaurant_dto_1.LoginDto) === "function" ? _f : Object]),
    tslib_1.__metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], RestaurantResolver.prototype, "LoginRestaurant", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => restaurant_type_1.LoginResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], RestaurantResolver.prototype, "getLoggedInRestaurant", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => restaurant_type_1.LogoutResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], RestaurantResolver.prototype, "logOutRestaurant", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => restaurant_type_1.FindRestaurantsNearResponse),
    tslib_1.__param(0, (0, graphql_1.Args)('findRestaurantsNearDto')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_j = typeof restaurant_dto_1.FindRestaurantsNearDto !== "undefined" && restaurant_dto_1.FindRestaurantsNearDto) === "function" ? _j : Object]),
    tslib_1.__metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], RestaurantResolver.prototype, "findRestaurantsNear", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.CreateMenuResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('createMenuDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_l = typeof restaurant_dto_1.CreateMenuDto !== "undefined" && restaurant_dto_1.CreateMenuDto) === "function" ? _l : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], RestaurantResolver.prototype, "createMenu", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.UpdateMenuResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('updateMenuDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_o = typeof restaurant_dto_1.UpdateMenuDto !== "undefined" && restaurant_dto_1.UpdateMenuDto) === "function" ? _o : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], RestaurantResolver.prototype, "updateMenu", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.DeleteMenuResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('deleteMenuDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_q = typeof restaurant_dto_1.DeleteMenuDto !== "undefined" && restaurant_dto_1.DeleteMenuDto) === "function" ? _q : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], RestaurantResolver.prototype, "deleteMenu", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.CreateCategoryResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('createCategoryDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_s = typeof restaurant_dto_1.CreateCategoryDto !== "undefined" && restaurant_dto_1.CreateCategoryDto) === "function" ? _s : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], RestaurantResolver.prototype, "createCategory", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.UpdateCategoryResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('updateCategoryDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_u = typeof restaurant_dto_1.UpdateCategoryDto !== "undefined" && restaurant_dto_1.UpdateCategoryDto) === "function" ? _u : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_v = typeof Promise !== "undefined" && Promise) === "function" ? _v : Object)
], RestaurantResolver.prototype, "updateCategory", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.DeleteCategoryResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('deleteCategoryDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_w = typeof restaurant_dto_1.DeleteCategoryDto !== "undefined" && restaurant_dto_1.DeleteCategoryDto) === "function" ? _w : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_x = typeof Promise !== "undefined" && Promise) === "function" ? _x : Object)
], RestaurantResolver.prototype, "deleteCategory", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.CreateMenuItemResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('createMenuItemDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_y = typeof restaurant_dto_1.CreateMenuItemDto !== "undefined" && restaurant_dto_1.CreateMenuItemDto) === "function" ? _y : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_z = typeof Promise !== "undefined" && Promise) === "function" ? _z : Object)
], RestaurantResolver.prototype, "createMenuItem", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.UpdateMenuItemResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('updateMenuItemDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_0 = typeof restaurant_dto_1.UpdateMenuItemDto !== "undefined" && restaurant_dto_1.UpdateMenuItemDto) === "function" ? _0 : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_1 = typeof Promise !== "undefined" && Promise) === "function" ? _1 : Object)
], RestaurantResolver.prototype, "updateMenuItem", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.DeleteMenuItemResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('deleteMenuItemDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_2 = typeof restaurant_dto_1.DeleteMenuItemDto !== "undefined" && restaurant_dto_1.DeleteMenuItemDto) === "function" ? _2 : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_3 = typeof Promise !== "undefined" && Promise) === "function" ? _3 : Object)
], RestaurantResolver.prototype, "deleteMenuItem", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.CreateOperatingHoursResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('createOperatingHoursDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_4 = typeof restaurant_dto_1.CreateOperatingHoursDto !== "undefined" && restaurant_dto_1.CreateOperatingHoursDto) === "function" ? _4 : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_5 = typeof Promise !== "undefined" && Promise) === "function" ? _5 : Object)
], RestaurantResolver.prototype, "createOperatingHours", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.UpdateOperatingHoursResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('updateOperatingHoursDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_6 = typeof restaurant_dto_1.UpdateOperatingHoursDto !== "undefined" && restaurant_dto_1.UpdateOperatingHoursDto) === "function" ? _6 : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_7 = typeof Promise !== "undefined" && Promise) === "function" ? _7 : Object)
], RestaurantResolver.prototype, "updateOperatingHours", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.DeleteOperatingHoursResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('deleteOperatingHoursDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_8 = typeof restaurant_dto_1.DeleteOperatingHoursDto !== "undefined" && restaurant_dto_1.DeleteOperatingHoursDto) === "function" ? _8 : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_9 = typeof Promise !== "undefined" && Promise) === "function" ? _9 : Object)
], RestaurantResolver.prototype, "deleteOperatingHours", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.AddStaffMemberResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('addStaffMemberDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_10 = typeof restaurant_dto_1.AddStaffMemberDto !== "undefined" && restaurant_dto_1.AddStaffMemberDto) === "function" ? _10 : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_11 = typeof Promise !== "undefined" && Promise) === "function" ? _11 : Object)
], RestaurantResolver.prototype, "addStaffMember", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => restaurant_type_1.RemoveStaffMemberResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Args)('removeStaffMemberDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_12 = typeof restaurant_dto_1.RemoveStaffMemberDto !== "undefined" && restaurant_dto_1.RemoveStaffMemberDto) === "function" ? _12 : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_13 = typeof Promise !== "undefined" && Promise) === "function" ? _13 : Object)
], RestaurantResolver.prototype, "removeStaffMember", null);
exports.RestaurantResolver = RestaurantResolver = tslib_1.__decorate([
    (0, graphql_1.Resolver)("Restaurant"),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof restaurant_service_1.RestaurantService !== "undefined" && restaurant_service_1.RestaurantService) === "function" ? _a : Object])
], RestaurantResolver);


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RemoveStaffMemberResponse = exports.AddStaffMemberResponse = exports.DeleteOperatingHoursResponse = exports.UpdateOperatingHoursResponse = exports.CreateOperatingHoursResponse = exports.DeleteMenuItemResponse = exports.UpdateMenuItemResponse = exports.CreateMenuItemResponse = exports.DeleteCategoryResponse = exports.UpdateCategoryResponse = exports.CreateCategoryResponse = exports.DeleteMenuResponse = exports.UpdateMenuResponse = exports.CreateMenuResponse = exports.FindRestaurantsNearResponse = exports.LogoutResponse = exports.LoginResponse = exports.ActivationResponse = exports.RegisterResponse = exports.ErrorType = exports.Restaurant = void 0;
const tslib_1 = __webpack_require__(1);
const graphql_1 = __webpack_require__(8);
const restaurant_entities_1 = __webpack_require__(27);
Object.defineProperty(exports, "Restaurant", ({ enumerable: true, get: function () { return restaurant_entities_1.Restaurant; } }));
let ErrorType = class ErrorType {
};
exports.ErrorType = ErrorType;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], ErrorType.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], ErrorType.prototype, "code", void 0);
exports.ErrorType = ErrorType = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], ErrorType);
let RegisterResponse = class RegisterResponse {
};
exports.RegisterResponse = RegisterResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], RegisterResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], RegisterResponse.prototype, "activation_token", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], RegisterResponse.prototype, "error", void 0);
exports.RegisterResponse = RegisterResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], RegisterResponse);
let ActivationResponse = class ActivationResponse {
};
exports.ActivationResponse = ActivationResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_a = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _a : Object)
], ActivationResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], ActivationResponse.prototype, "error", void 0);
exports.ActivationResponse = ActivationResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], ActivationResponse);
let LoginResponse = class LoginResponse {
};
exports.LoginResponse = LoginResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant, { nullable: true }),
    tslib_1.__metadata("design:type", typeof (_b = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _b : Object)
], LoginResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], LoginResponse.prototype, "accessToken", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], LoginResponse.prototype, "refreshToken", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], LoginResponse.prototype, "error", void 0);
exports.LoginResponse = LoginResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], LoginResponse);
let LogoutResponse = class LogoutResponse {
};
exports.LogoutResponse = LogoutResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], LogoutResponse.prototype, "message", void 0);
exports.LogoutResponse = LogoutResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], LogoutResponse);
let FindRestaurantsNearResponse = class FindRestaurantsNearResponse {
};
exports.FindRestaurantsNearResponse = FindRestaurantsNearResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [restaurant_entities_1.Restaurant]),
    tslib_1.__metadata("design:type", Array)
], FindRestaurantsNearResponse.prototype, "restaurants", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], FindRestaurantsNearResponse.prototype, "error", void 0);
exports.FindRestaurantsNearResponse = FindRestaurantsNearResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], FindRestaurantsNearResponse);
// ==================== MENU MANAGEMENT RESPONSES ====================
let CreateMenuResponse = class CreateMenuResponse {
};
exports.CreateMenuResponse = CreateMenuResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], CreateMenuResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_c = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _c : Object)
], CreateMenuResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], CreateMenuResponse.prototype, "error", void 0);
exports.CreateMenuResponse = CreateMenuResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], CreateMenuResponse);
let UpdateMenuResponse = class UpdateMenuResponse {
};
exports.UpdateMenuResponse = UpdateMenuResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], UpdateMenuResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_d = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _d : Object)
], UpdateMenuResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], UpdateMenuResponse.prototype, "error", void 0);
exports.UpdateMenuResponse = UpdateMenuResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], UpdateMenuResponse);
let DeleteMenuResponse = class DeleteMenuResponse {
};
exports.DeleteMenuResponse = DeleteMenuResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], DeleteMenuResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_e = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _e : Object)
], DeleteMenuResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], DeleteMenuResponse.prototype, "error", void 0);
exports.DeleteMenuResponse = DeleteMenuResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], DeleteMenuResponse);
// ==================== CATEGORY MANAGEMENT RESPONSES ====================
let CreateCategoryResponse = class CreateCategoryResponse {
};
exports.CreateCategoryResponse = CreateCategoryResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], CreateCategoryResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_f = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _f : Object)
], CreateCategoryResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], CreateCategoryResponse.prototype, "error", void 0);
exports.CreateCategoryResponse = CreateCategoryResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], CreateCategoryResponse);
let UpdateCategoryResponse = class UpdateCategoryResponse {
};
exports.UpdateCategoryResponse = UpdateCategoryResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], UpdateCategoryResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_g = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _g : Object)
], UpdateCategoryResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], UpdateCategoryResponse.prototype, "error", void 0);
exports.UpdateCategoryResponse = UpdateCategoryResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], UpdateCategoryResponse);
let DeleteCategoryResponse = class DeleteCategoryResponse {
};
exports.DeleteCategoryResponse = DeleteCategoryResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], DeleteCategoryResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_h = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _h : Object)
], DeleteCategoryResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], DeleteCategoryResponse.prototype, "error", void 0);
exports.DeleteCategoryResponse = DeleteCategoryResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], DeleteCategoryResponse);
// ==================== MENU ITEM MANAGEMENT RESPONSES ====================
let CreateMenuItemResponse = class CreateMenuItemResponse {
};
exports.CreateMenuItemResponse = CreateMenuItemResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], CreateMenuItemResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_j = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _j : Object)
], CreateMenuItemResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], CreateMenuItemResponse.prototype, "error", void 0);
exports.CreateMenuItemResponse = CreateMenuItemResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], CreateMenuItemResponse);
let UpdateMenuItemResponse = class UpdateMenuItemResponse {
};
exports.UpdateMenuItemResponse = UpdateMenuItemResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], UpdateMenuItemResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_k = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _k : Object)
], UpdateMenuItemResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], UpdateMenuItemResponse.prototype, "error", void 0);
exports.UpdateMenuItemResponse = UpdateMenuItemResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], UpdateMenuItemResponse);
let DeleteMenuItemResponse = class DeleteMenuItemResponse {
};
exports.DeleteMenuItemResponse = DeleteMenuItemResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], DeleteMenuItemResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_l = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _l : Object)
], DeleteMenuItemResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], DeleteMenuItemResponse.prototype, "error", void 0);
exports.DeleteMenuItemResponse = DeleteMenuItemResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], DeleteMenuItemResponse);
// ==================== OPERATING HOURS MANAGEMENT RESPONSES ====================
let CreateOperatingHoursResponse = class CreateOperatingHoursResponse {
};
exports.CreateOperatingHoursResponse = CreateOperatingHoursResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], CreateOperatingHoursResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_m = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _m : Object)
], CreateOperatingHoursResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], CreateOperatingHoursResponse.prototype, "error", void 0);
exports.CreateOperatingHoursResponse = CreateOperatingHoursResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], CreateOperatingHoursResponse);
let UpdateOperatingHoursResponse = class UpdateOperatingHoursResponse {
};
exports.UpdateOperatingHoursResponse = UpdateOperatingHoursResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], UpdateOperatingHoursResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_o = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _o : Object)
], UpdateOperatingHoursResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], UpdateOperatingHoursResponse.prototype, "error", void 0);
exports.UpdateOperatingHoursResponse = UpdateOperatingHoursResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], UpdateOperatingHoursResponse);
let DeleteOperatingHoursResponse = class DeleteOperatingHoursResponse {
};
exports.DeleteOperatingHoursResponse = DeleteOperatingHoursResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], DeleteOperatingHoursResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_p = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _p : Object)
], DeleteOperatingHoursResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], DeleteOperatingHoursResponse.prototype, "error", void 0);
exports.DeleteOperatingHoursResponse = DeleteOperatingHoursResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], DeleteOperatingHoursResponse);
// ==================== STAFF MANAGEMENT RESPONSES ====================
let AddStaffMemberResponse = class AddStaffMemberResponse {
};
exports.AddStaffMemberResponse = AddStaffMemberResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], AddStaffMemberResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_q = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _q : Object)
], AddStaffMemberResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], AddStaffMemberResponse.prototype, "error", void 0);
exports.AddStaffMemberResponse = AddStaffMemberResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], AddStaffMemberResponse);
let RemoveStaffMemberResponse = class RemoveStaffMemberResponse {
};
exports.RemoveStaffMemberResponse = RemoveStaffMemberResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], RemoveStaffMemberResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Restaurant),
    tslib_1.__metadata("design:type", typeof (_r = typeof restaurant_entities_1.Restaurant !== "undefined" && restaurant_entities_1.Restaurant) === "function" ? _r : Object)
], RemoveStaffMemberResponse.prototype, "restaurant", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], RemoveStaffMemberResponse.prototype, "error", void 0);
exports.RemoveStaffMemberResponse = RemoveStaffMemberResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], RemoveStaffMemberResponse);


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Restaurant = exports.User = exports.OperatingHours = exports.Menu = exports.Category = exports.Avatar = exports.GeoPoint = exports.MenuItem = void 0;
const tslib_1 = __webpack_require__(1);
const graphql_1 = __webpack_require__(8);
const menu_item_entities_1 = __webpack_require__(28);
Object.defineProperty(exports, "MenuItem", ({ enumerable: true, get: function () { return menu_item_entities_1.MenuItem; } }));
let GeoPoint = class GeoPoint {
};
exports.GeoPoint = GeoPoint;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], GeoPoint.prototype, "type", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [graphql_1.Float]),
    tslib_1.__metadata("design:type", Array)
], GeoPoint.prototype, "coordinates", void 0);
exports.GeoPoint = GeoPoint = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], GeoPoint);
let Avatar = class Avatar {
};
exports.Avatar = Avatar;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Avatar.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Avatar.prototype, "public_id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Avatar.prototype, "url", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Avatar.prototype, "restaurantId", void 0);
exports.Avatar = Avatar = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], Avatar);
let Category = class Category {
};
exports.Category = Category;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Category.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Category.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Category.prototype, "description", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Category.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Category.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Category.prototype, "updatedAt", void 0);
exports.Category = Category = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], Category);
let Menu = class Menu {
};
exports.Menu = Menu;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Menu.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Menu.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Menu.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Menu.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Menu.prototype, "updatedAt", void 0);
exports.Menu = Menu = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], Menu);
let OperatingHours = class OperatingHours {
};
exports.OperatingHours = OperatingHours;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], OperatingHours.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], OperatingHours.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], OperatingHours.prototype, "dayOfWeek", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], OperatingHours.prototype, "openTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], OperatingHours.prototype, "closeTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", Boolean)
], OperatingHours.prototype, "isClosed", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], OperatingHours.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], OperatingHours.prototype, "updatedAt", void 0);
exports.OperatingHours = OperatingHours = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], OperatingHours);
let User = class User {
};
exports.User = User;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], User.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], User.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], User.prototype, "email", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], User.prototype, "role", void 0);
exports.User = User = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], User);
let Restaurant = class Restaurant {
};
exports.Restaurant = Restaurant;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Restaurant.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Restaurant.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Restaurant.prototype, "country", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Restaurant.prototype, "city", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Restaurant.prototype, "address", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Restaurant.prototype, "email", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", Number)
], Restaurant.prototype, "phone_number", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", GeoPoint)
], Restaurant.prototype, "coordinates", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Restaurant.prototype, "ownerId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => User, { nullable: true }),
    tslib_1.__metadata("design:type", User)
], Restaurant.prototype, "owner", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [Menu]),
    tslib_1.__metadata("design:type", Array)
], Restaurant.prototype, "menus", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [Category]),
    tslib_1.__metadata("design:type", Array)
], Restaurant.prototype, "categories", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [menu_item_entities_1.MenuItem]),
    tslib_1.__metadata("design:type", Array)
], Restaurant.prototype, "menuItems", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [OperatingHours]),
    tslib_1.__metadata("design:type", Array)
], Restaurant.prototype, "operatingHours", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], Restaurant.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_h = typeof Date !== "undefined" && Date) === "function" ? _h : Object)
], Restaurant.prototype, "updatedAt", void 0);
exports.Restaurant = Restaurant = tslib_1.__decorate([
    (0, graphql_1.ObjectType)(),
    (0, graphql_1.Directive)('@key(fields: "id")')
], Restaurant);


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuItem = exports.Image = void 0;
const tslib_1 = __webpack_require__(1);
const graphql_1 = __webpack_require__(8);
const restaurant_entities_1 = __webpack_require__(27);
let Image = class Image {
};
exports.Image = Image;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Image.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Image.prototype, "public_id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Image.prototype, "url", void 0);
exports.Image = Image = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], Image);
let MenuItem = class MenuItem {
};
exports.MenuItem = MenuItem;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], MenuItem.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], MenuItem.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], MenuItem.prototype, "description", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", Number)
], MenuItem.prototype, "price", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", Number)
], MenuItem.prototype, "estimatedPrice", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", Boolean)
], MenuItem.prototype, "available", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], MenuItem.prototype, "categoryId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Category, { nullable: true }),
    tslib_1.__metadata("design:type", typeof (_a = typeof restaurant_entities_1.Category !== "undefined" && restaurant_entities_1.Category) === "function" ? _a : Object)
], MenuItem.prototype, "category", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], MenuItem.prototype, "menuId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => restaurant_entities_1.Menu, { nullable: true }),
    tslib_1.__metadata("design:type", typeof (_b = typeof restaurant_entities_1.Menu !== "undefined" && restaurant_entities_1.Menu) === "function" ? _b : Object)
], MenuItem.prototype, "menu", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [Image], { nullable: true }),
    tslib_1.__metadata("design:type", Array)
], MenuItem.prototype, "images", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], MenuItem.prototype, "restaurantId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], MenuItem.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], MenuItem.prototype, "updatedAt", void 0);
exports.MenuItem = MenuItem = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], MenuItem);


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RemoveStaffMemberDto = exports.AddStaffMemberDto = exports.DeleteOperatingHoursDto = exports.UpdateOperatingHoursDto = exports.CreateOperatingHoursDto = exports.DeleteMenuItemDto = exports.UpdateMenuItemDto = exports.CreateMenuItemDto = exports.DeleteCategoryDto = exports.UpdateCategoryDto = exports.CreateCategoryDto = exports.DeleteMenuDto = exports.UpdateMenuDto = exports.CreateMenuDto = exports.FindRestaurantsNearDto = exports.LoginDto = exports.ActivationDto = exports.RegisterDto = exports.GeoPointInput = void 0;
const tslib_1 = __webpack_require__(1);
const graphql_1 = __webpack_require__(8);
const class_validator_1 = __webpack_require__(30);
let GeoPointInput = class GeoPointInput {
};
exports.GeoPointInput = GeoPointInput;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], GeoPointInput.prototype, "type", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [graphql_1.Float]),
    tslib_1.__metadata("design:type", Array)
], GeoPointInput.prototype, "coordinates", void 0);
exports.GeoPointInput = GeoPointInput = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], GeoPointInput);
let RegisterDto = class RegisterDto {
};
exports.RegisterDto = RegisterDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Restaurant name is required.' }),
    (0, class_validator_1.IsString)({ message: 'Restaurant name must be a string.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Country is required.' }),
    (0, class_validator_1.IsString)({ message: 'Country must be a string.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "country", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'City is required.' }),
    (0, class_validator_1.IsString)({ message: 'City must be a string.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "city", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Address is required.' }),
    (0, class_validator_1.IsString)({ message: 'Address must be a string.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "address", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required.' }),
    (0, class_validator_1.IsString)({ message: 'Email must be a string.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Phone number must be a number.' }),
    tslib_1.__metadata("design:type", Number)
], RegisterDto.prototype, "phone_number", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required.' }),
    (0, class_validator_1.IsString)({ message: 'Password must be a string.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => GeoPointInput, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", GeoPointInput)
], RegisterDto.prototype, "coordinates", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Owner ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "ownerId", void 0);
exports.RegisterDto = RegisterDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], RegisterDto);
let ActivationDto = class ActivationDto {
};
exports.ActivationDto = ActivationDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Activation token is required.' }),
    (0, class_validator_1.IsString)({ message: 'Activation token must be a string.' }),
    tslib_1.__metadata("design:type", String)
], ActivationDto.prototype, "activationToken", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Activation code is required.' }),
    (0, class_validator_1.IsString)({ message: 'Activation code must be a string.' }),
    tslib_1.__metadata("design:type", String)
], ActivationDto.prototype, "activationCode", void 0);
exports.ActivationDto = ActivationDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], ActivationDto);
let LoginDto = class LoginDto {
};
exports.LoginDto = LoginDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required.' }),
    (0, class_validator_1.IsString)({ message: 'Email must be a string.' }),
    tslib_1.__metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required.' }),
    (0, class_validator_1.IsString)({ message: 'Password must be a string.' }),
    tslib_1.__metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
exports.LoginDto = LoginDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], LoginDto);
let FindRestaurantsNearDto = class FindRestaurantsNearDto {
};
exports.FindRestaurantsNearDto = FindRestaurantsNearDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [graphql_1.Float]),
    (0, class_validator_1.IsArray)({ message: 'Coordinates must be an array.' }),
    (0, class_validator_1.IsNumber)({}, { each: true, message: 'Coordinates must be numbers.' }),
    tslib_1.__metadata("design:type", Array)
], FindRestaurantsNearDto.prototype, "coordinates", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    (0, class_validator_1.IsNumber)({}, { message: 'Max distance must be a number.' }),
    tslib_1.__metadata("design:type", Number)
], FindRestaurantsNearDto.prototype, "maxDistance", void 0);
exports.FindRestaurantsNearDto = FindRestaurantsNearDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], FindRestaurantsNearDto);
// ==================== MENU MANAGEMENT DTOs ====================
let CreateMenuDto = class CreateMenuDto {
};
exports.CreateMenuDto = CreateMenuDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Menu name is required.' }),
    (0, class_validator_1.IsString)({ message: 'Menu name must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateMenuDto.prototype, "name", void 0);
exports.CreateMenuDto = CreateMenuDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], CreateMenuDto);
let UpdateMenuDto = class UpdateMenuDto {
};
exports.UpdateMenuDto = UpdateMenuDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Menu ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'Menu ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateMenuDto.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Menu name is required.' }),
    (0, class_validator_1.IsString)({ message: 'Menu name must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateMenuDto.prototype, "name", void 0);
exports.UpdateMenuDto = UpdateMenuDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], UpdateMenuDto);
let DeleteMenuDto = class DeleteMenuDto {
};
exports.DeleteMenuDto = DeleteMenuDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Menu ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'Menu ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], DeleteMenuDto.prototype, "id", void 0);
exports.DeleteMenuDto = DeleteMenuDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], DeleteMenuDto);
// ==================== CATEGORY MANAGEMENT DTOs ====================
let CreateCategoryDto = class CreateCategoryDto {
};
exports.CreateCategoryDto = CreateCategoryDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category name is required.' }),
    (0, class_validator_1.IsString)({ message: 'Category name must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateCategoryDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category description is required.' }),
    (0, class_validator_1.IsString)({ message: 'Category description must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateCategoryDto.prototype, "description", void 0);
exports.CreateCategoryDto = CreateCategoryDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], CreateCategoryDto);
let UpdateCategoryDto = class UpdateCategoryDto {
};
exports.UpdateCategoryDto = UpdateCategoryDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'Category ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateCategoryDto.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category name is required.' }),
    (0, class_validator_1.IsString)({ message: 'Category name must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateCategoryDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category description is required.' }),
    (0, class_validator_1.IsString)({ message: 'Category description must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateCategoryDto.prototype, "description", void 0);
exports.UpdateCategoryDto = UpdateCategoryDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], UpdateCategoryDto);
let DeleteCategoryDto = class DeleteCategoryDto {
};
exports.DeleteCategoryDto = DeleteCategoryDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'Category ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], DeleteCategoryDto.prototype, "id", void 0);
exports.DeleteCategoryDto = DeleteCategoryDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], DeleteCategoryDto);
// ==================== MENU ITEM MANAGEMENT DTOs ====================
let CreateMenuItemDto = class CreateMenuItemDto {
};
exports.CreateMenuItemDto = CreateMenuItemDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Menu item name is required.' }),
    (0, class_validator_1.IsString)({ message: 'Menu item name must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateMenuItemDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Description is required.' }),
    (0, class_validator_1.IsString)({ message: 'Description must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateMenuItemDto.prototype, "description", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    (0, class_validator_1.IsNumber)({}, { message: 'Price must be a number.' }),
    tslib_1.__metadata("design:type", Number)
], CreateMenuItemDto.prototype, "price", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Estimated price must be a number.' }),
    tslib_1.__metadata("design:type", Number)
], CreateMenuItemDto.prototype, "estimatedPrice", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Category ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateMenuItemDto.prototype, "categoryId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Menu ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateMenuItemDto.prototype, "menuId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", Boolean)
], CreateMenuItemDto.prototype, "available", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Menu item images must be an array.' }),
    tslib_1.__metadata("design:type", Array)
], CreateMenuItemDto.prototype, "images", void 0);
exports.CreateMenuItemDto = CreateMenuItemDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], CreateMenuItemDto);
let UpdateMenuItemDto = class UpdateMenuItemDto {
};
exports.UpdateMenuItemDto = UpdateMenuItemDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Menu item ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'Menu item ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateMenuItemDto.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Menu item name is required.' }),
    (0, class_validator_1.IsString)({ message: 'Menu item name must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateMenuItemDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Description is required.' }),
    (0, class_validator_1.IsString)({ message: 'Description must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateMenuItemDto.prototype, "description", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    (0, class_validator_1.IsNumber)({}, { message: 'Price must be a number.' }),
    tslib_1.__metadata("design:type", Number)
], UpdateMenuItemDto.prototype, "price", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float, { nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Estimated price must be a number.' }),
    tslib_1.__metadata("design:type", Number)
], UpdateMenuItemDto.prototype, "estimatedPrice", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Category ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateMenuItemDto.prototype, "categoryId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Menu ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateMenuItemDto.prototype, "menuId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", Boolean)
], UpdateMenuItemDto.prototype, "available", void 0);
exports.UpdateMenuItemDto = UpdateMenuItemDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], UpdateMenuItemDto);
let DeleteMenuItemDto = class DeleteMenuItemDto {
};
exports.DeleteMenuItemDto = DeleteMenuItemDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Menu item ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'Menu item ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], DeleteMenuItemDto.prototype, "id", void 0);
exports.DeleteMenuItemDto = DeleteMenuItemDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], DeleteMenuItemDto);
// ==================== OPERATING HOURS MANAGEMENT DTOs ====================
let CreateOperatingHoursDto = class CreateOperatingHoursDto {
};
exports.CreateOperatingHoursDto = CreateOperatingHoursDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Day of week is required.' }),
    (0, class_validator_1.IsString)({ message: 'Day of week must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateOperatingHoursDto.prototype, "dayOfWeek", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Open time is required.' }),
    (0, class_validator_1.IsString)({ message: 'Open time must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateOperatingHoursDto.prototype, "openTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Close time is required.' }),
    (0, class_validator_1.IsString)({ message: 'Close time must be a string.' }),
    tslib_1.__metadata("design:type", String)
], CreateOperatingHoursDto.prototype, "closeTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", Boolean)
], CreateOperatingHoursDto.prototype, "isClosed", void 0);
exports.CreateOperatingHoursDto = CreateOperatingHoursDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], CreateOperatingHoursDto);
let UpdateOperatingHoursDto = class UpdateOperatingHoursDto {
};
exports.UpdateOperatingHoursDto = UpdateOperatingHoursDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Operating hours ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'Operating hours ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateOperatingHoursDto.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Day of week is required.' }),
    (0, class_validator_1.IsString)({ message: 'Day of week must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateOperatingHoursDto.prototype, "dayOfWeek", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Open time is required.' }),
    (0, class_validator_1.IsString)({ message: 'Open time must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateOperatingHoursDto.prototype, "openTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Close time is required.' }),
    (0, class_validator_1.IsString)({ message: 'Close time must be a string.' }),
    tslib_1.__metadata("design:type", String)
], UpdateOperatingHoursDto.prototype, "closeTime", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    tslib_1.__metadata("design:type", Boolean)
], UpdateOperatingHoursDto.prototype, "isClosed", void 0);
exports.UpdateOperatingHoursDto = UpdateOperatingHoursDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], UpdateOperatingHoursDto);
let DeleteOperatingHoursDto = class DeleteOperatingHoursDto {
};
exports.DeleteOperatingHoursDto = DeleteOperatingHoursDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Operating hours ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'Operating hours ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], DeleteOperatingHoursDto.prototype, "id", void 0);
exports.DeleteOperatingHoursDto = DeleteOperatingHoursDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], DeleteOperatingHoursDto);
// ==================== STAFF MANAGEMENT DTOs ====================
let AddStaffMemberDto = class AddStaffMemberDto {
};
exports.AddStaffMemberDto = AddStaffMemberDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'User ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'User ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], AddStaffMemberDto.prototype, "userId", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Role is required.' }),
    (0, class_validator_1.IsString)({ message: 'Role must be a string.' }),
    tslib_1.__metadata("design:type", String)
], AddStaffMemberDto.prototype, "role", void 0);
exports.AddStaffMemberDto = AddStaffMemberDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], AddStaffMemberDto);
let RemoveStaffMemberDto = class RemoveStaffMemberDto {
};
exports.RemoveStaffMemberDto = RemoveStaffMemberDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'User ID is required.' }),
    (0, class_validator_1.IsString)({ message: 'User ID must be a string.' }),
    tslib_1.__metadata("design:type", String)
], RemoveStaffMemberDto.prototype, "userId", void 0);
exports.RemoveStaffMemberDto = RemoveStaffMemberDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], RemoveStaffMemberDto);


/***/ }),
/* 30 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthGuard = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const graphql_1 = __webpack_require__(8);
const jwt_1 = __webpack_require__(10);
const config_1 = __webpack_require__(7);
const prisma_service_1 = __webpack_require__(11);
let AuthGuard = class AuthGuard {
    constructor(jwtService, prisma, config) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.config = config;
    }
    async canActivate(context) {
        const gqlContext = graphql_1.GqlExecutionContext.create(context);
        const { req } = gqlContext.getContext();
        const accessToken = req.headers.accesstoken;
        const refreshToken = req.headers.refreshtoken;
        if (!accessToken || !refreshToken) {
            throw new common_1.UnauthorizedException('Please login to access this resource!');
        }
        try {
            // Verify signature AND expiration properly
            const decoded = this.jwtService.verify(accessToken, {
                secret: this.config.get('ACCESS_TOKEN_SECRET'),
            });
            req.restaurant = { id: decoded.id, email: decoded.email };
            req.accesstoken = accessToken;
            req.refreshtoken = refreshToken;
            return true;
        }
        catch (error) {
            // If access token expired, try refreshing
            if (error?.name === 'TokenExpiredError') {
                await this.updateAccessToken(req);
                return true;
            }
            throw new common_1.UnauthorizedException('Invalid or expired token!');
        }
    }
    async updateAccessToken(req) {
        try {
            const refreshTokenData = req.headers.refreshtoken;
            const decoded = this.jwtService.verify(refreshTokenData, {
                secret: this.config.get('REFRESH_TOKEN_SECRET'),
            });
            const expirationTime = decoded.exp * 1000;
            if (expirationTime < Date.now()) {
                throw new common_1.UnauthorizedException('Please login to access this resource!');
            }
            const restaurant = await this.prisma.restaurant.findUnique({
                where: {
                    id: decoded.id,
                },
            });
            const accessToken = this.jwtService.sign({ id: restaurant.id }, {
                secret: this.config.get('ACCESS_TOKEN_SECRET'),
                expiresIn: '15m',
            });
            const refreshToken = this.jwtService.sign({ id: restaurant.id }, {
                secret: this.config.get('REFRESH_TOKEN_SECRET'),
                expiresIn: '7d',
            });
            req.accesstoken = accessToken;
            req.refreshtoken = refreshToken;
            req.restaurant = restaurant;
        }
        catch (error) {
            throw new common_1.UnauthorizedException(error.message);
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object])
], AuthGuard);


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var RestaurantController_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RestaurantController = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const microservices_1 = __webpack_require__(3);
const common_2 = __webpack_require__(6);
const restaurant_service_1 = __webpack_require__(17);
let RestaurantController = RestaurantController_1 = class RestaurantController {
    constructor(restaurantService) {
        this.restaurantService = restaurantService;
        this.logger = new common_2.Logger(RestaurantController_1.name);
    }
    async validateRestaurant(data) {
        this.logger.log(`Received data: ${JSON.stringify(data)}`);
        const payload = data.restaurantId ? data : (data.data || data);
        return await this.restaurantService.validateRestaurant(payload);
    }
    async validateMenuItems(data) {
        this.logger.log(`Received data: ${JSON.stringify(data)}`);
        const payload = data.restaurantId ? data : (data.data || data);
        return await this.restaurantService.validateMenuItems(payload);
    }
};
exports.RestaurantController = RestaurantController;
tslib_1.__decorate([
    (0, microservices_1.MessagePattern)('restaurant.validate'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], RestaurantController.prototype, "validateRestaurant", null);
tslib_1.__decorate([
    (0, microservices_1.MessagePattern)('menu.validateItems'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], RestaurantController.prototype, "validateMenuItems", null);
exports.RestaurantController = RestaurantController = RestaurantController_1 = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof restaurant_service_1.RestaurantService !== "undefined" && restaurant_service_1.RestaurantService) === "function" ? _a : Object])
], RestaurantController);


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MenuItemService = void 0;
const tslib_1 = __webpack_require__(1);
// apps/api-restaurants/src/foods/menu-item.service.ts
const common_1 = __webpack_require__(6);
const prisma_service_1 = __webpack_require__(11);
const config_1 = __webpack_require__(7);
const email_service_1 = __webpack_require__(14);
const cloudinary_service_1 = __webpack_require__(34);
let MenuItemService = class MenuItemService {
    constructor(prisma, configService, emailService, cloudinaryService) {
        this.prisma = prisma;
        this.configService = configService;
        this.emailService = emailService;
        this.cloudinaryService = cloudinaryService;
    }
    async createMenuItem(createMenuItemDto, req) {
        const { name, description, price, estimatedPrice, categoryId, menuId, images } = createMenuItemDto;
        const restaurantId = req.restaurant?.id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Restaurant not authenticated');
        }
        let menuItemImages = [];
        if (images && images.length > 0) {
            const uploadResults = await this.cloudinaryService.uploadMultiple(images, 'menu-items');
            menuItemImages = uploadResults.map(result => ({
                public_id: result.public_id,
                url: result.secure_url,
            }));
        }
        const menuItemData = {
            name,
            description,
            price,
            estimatedPrice,
            categoryId,
            menuId,
            available: true,
            images: {
                create: menuItemImages.map((image) => ({
                    public_id: image.public_id,
                    url: image.url,
                })),
            },
            restaurantId,
        };
        await this.prisma.menuItem.create({
            data: menuItemData,
        });
        return { message: 'Menu Item Created Successfully!' };
    }
    async getLoggedInRestaurantMenuItems(req) {
        const restaurantId = req.restaurant?.id;
        const menuItems = await this.prisma.menuItem.findMany({
            where: { restaurantId },
            include: { images: true, restaurant: true, category: true, menu: true },
            orderBy: { createdAt: 'desc' },
        });
        return { menuItems };
    }
    async deleteMenuItem(deleteMenuItemDto, req) {
        const restaurantId = req.restaurant?.id;
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: deleteMenuItemDto.id },
            include: { restaurant: true, images: true },
        });
        if (!menuItem || menuItem.restaurant.id !== restaurantId) {
            throw new common_1.BadRequestException('Only restaurant owner can delete menu item!');
        }
        // Delete associated images from Cloudinary and database
        if (menuItem.images && menuItem.images.length > 0) {
            const publicIds = menuItem.images.map(img => img.public_id);
            await this.cloudinaryService.deleteMultipleImages(publicIds);
        }
        await this.prisma.images.deleteMany({
            where: { foodId: deleteMenuItemDto.id },
        });
        await this.prisma.menuItem.delete({
            where: { id: deleteMenuItemDto.id },
        });
        return { message: 'Menu Item Deleted Successfully!' };
    }
};
exports.MenuItemService = MenuItemService;
exports.MenuItemService = MenuItemService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _c : Object, typeof (_d = typeof cloudinary_service_1.CloudinaryService !== "undefined" && cloudinary_service_1.CloudinaryService) === "function" ? _d : Object])
], MenuItemService);


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var CloudinaryService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CloudinaryService = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const cloudinary_1 = __webpack_require__(35);
let CloudinaryService = CloudinaryService_1 = class CloudinaryService {
    constructor() {
        this.logger = new common_1.Logger(CloudinaryService_1.name);
    }
    async upload(data, folder = "restaurants") {
        try {
            this.logger.log(`🍕 RESTAURANT SERVICE | ☁️ Uploading image to Cloudinary folder: ${folder}`);
            const result = await cloudinary_1.v2.uploader.upload(data, {
                folder: `snackrapido/${folder}`,
                resource_type: "auto",
                quality: "auto",
                fetch_format: "auto",
            });
            this.logger.log(`🍕 RESTAURANT SERVICE | ✅ Image uploaded successfully: ${result.public_id}`);
            return result;
        }
        catch (error) {
            this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to upload image:`, error);
            throw error;
        }
    }
    async uploadMultiple(images, folder = "restaurants") {
        try {
            this.logger.log(`🍕 RESTAURANT SERVICE | ☁️ Uploading ${images.length} images to Cloudinary`);
            const uploadPromises = images.map(image => this.upload(image, folder));
            const results = await Promise.all(uploadPromises);
            this.logger.log(`🍕 RESTAURANT SERVICE | ✅ All ${images.length} images uploaded successfully`);
            return results;
        }
        catch (error) {
            this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to upload multiple images:`, error);
            throw error;
        }
    }
    async deleteImage(publicId) {
        try {
            this.logger.log(`🍕 RESTAURANT SERVICE | 🗑️ Deleting image: ${publicId}`);
            await cloudinary_1.v2.uploader.destroy(publicId);
            this.logger.log(`🍕 RESTAURANT SERVICE | ✅ Image deleted successfully: ${publicId}`);
        }
        catch (error) {
            this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to delete image ${publicId}:`, error);
            throw error;
        }
    }
    async deleteMultipleImages(publicIds) {
        try {
            this.logger.log(`🍕 RESTAURANT SERVICE | 🗑️ Deleting ${publicIds.length} images`);
            const deletePromises = publicIds.map(publicId => this.deleteImage(publicId));
            await Promise.all(deletePromises);
            this.logger.log(`🍕 RESTAURANT SERVICE | ✅ All ${publicIds.length} images deleted successfully`);
        }
        catch (error) {
            this.logger.error(`🍕 RESTAURANT SERVICE | ❌ Failed to delete multiple images:`, error);
            throw error;
        }
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = CloudinaryService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)()
], CloudinaryService);


/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = require("cloudinary");

/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CloudinaryModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const cloudinary_provider_1 = __webpack_require__(37);
const cloudinary_service_1 = __webpack_require__(34);
let CloudinaryModule = class CloudinaryModule {
};
exports.CloudinaryModule = CloudinaryModule;
exports.CloudinaryModule = CloudinaryModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [cloudinary_provider_1.CloudinaryProvider, cloudinary_service_1.CloudinaryService],
        exports: [cloudinary_service_1.CloudinaryService],
    })
], CloudinaryModule);


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CloudinaryProvider = void 0;
const cloudinary_1 = __webpack_require__(35);
const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    useFactory: () => {
        return cloudinary_1.v2.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.CLOUD_API_KEY,
            api_secret: process.env.CLOUD_API_SECRET,
        });
    },
};
exports.CloudinaryProvider = CloudinaryProvider;


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SharedModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(7);
const microservices_module_1 = __webpack_require__(39);
const redis_module_1 = __webpack_require__(40);
const rabbitmq_service_1 = __webpack_require__(18);
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            microservices_module_1.SharedMicroservicesModule,
            redis_module_1.RedisModule,
        ],
        providers: [rabbitmq_service_1.RabbitMQService],
        exports: [rabbitmq_service_1.RabbitMQService],
    })
], SharedModule);


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SharedMicroservicesModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const microservices_1 = __webpack_require__(3);
const config_1 = __webpack_require__(7);
let SharedMicroservicesModule = class SharedMicroservicesModule {
};
exports.SharedMicroservicesModule = SharedMicroservicesModule;
exports.SharedMicroservicesModule = SharedMicroservicesModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            // RabbitMQ Configuration
            microservices_1.ClientsModule.registerAsync([
                {
                    name: 'RABBITMQ_SERVICE',
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [configService.get('RABBITMQ_URL') || 'amqp://admin:rabbit123@localhost:5673'],
                            queue: 'snackrapido_queue',
                            queueOptions: {
                                durable: true,
                            },
                            socketOptions: {
                                heartbeatIntervalInSeconds: 60,
                                reconnectTimeInSeconds: 5,
                            },
                        },
                    }),
                    inject: [config_1.ConfigService],
                },
                {
                    name: 'NOTIFICATIONS_SERVICE',
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [configService.get('RABBITMQ_URL') || 'amqp://admin:rabbit123@localhost:5673'],
                            queue: 'notifications_queue',
                            queueOptions: {
                                durable: true,
                            },
                        },
                    }),
                    inject: [config_1.ConfigService],
                },
                {
                    name: 'ANALYTICS_SERVICE',
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [configService.get('RABBITMQ_URL') || 'amqp://admin:rabbit123@localhost:5673'],
                            queue: 'analytics_queue',
                            queueOptions: {
                                durable: true,
                            },
                        },
                    }),
                    inject: [config_1.ConfigService],
                },
            ]),
        ],
        exports: [microservices_1.ClientsModule],
    })
], SharedMicroservicesModule);


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const tslib_1 = __webpack_require__(1);
const common_1 = __webpack_require__(6);
const config_1 = __webpack_require__(7);
const ioredis_1 = __webpack_require__(21);
const redis_service_1 = __webpack_require__(20);
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: 'REDIS_CLIENT',
                useFactory: (configService) => {
                    return new ioredis_1.Redis({
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6380),
                        password: configService.get('REDIS_PASSWORD'),
                        lazyConnect: true,
                    });
                },
                inject: [config_1.ConfigService],
            },
            redis_service_1.RedisService,
        ],
        exports: [redis_service_1.RedisService, 'REDIS_CLIENT'],
    })
], RedisModule);


/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("express");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(1);
const core_1 = __webpack_require__(2);
const microservices_1 = __webpack_require__(3);
const path_1 = __webpack_require__(4);
const restaurant_module_1 = __webpack_require__(5);
const express = tslib_1.__importStar(__webpack_require__(41));
async function bootstrap() {
    console.log(`\n╔══════════════════════════════════════════════════════════════╗
║ 🍕 RESTAURANTS SERVICE                                     ║
║ Restaurant & Menu Management System                          ║
╚══════════════════════════════════════════════════════════════╝`);
    const app = await core_1.NestFactory.create(restaurant_module_1.restaurantModule);
    // Connect to RabbitMQ as a microservice consumer
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://admin:rabbit123@localhost:5673'],
            queue: 'snackrapido_queue',
            queueOptions: {
                durable: true,
            },
        },
    });
    app.use(express.json({ limit: "50mb" }));
    app.useStaticAssets((0, path_1.join)(__dirname, "..", "public"));
    app.setBaseViewsDir((0, path_1.join)(__dirname, "..", "apps/api-restaurants/email-templates"));
    app.setViewEngine("ejs");
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:4000',
            'https://studio.apollographql.com',
        ],
        credentials: true,
    });
    // Start all microservices and wait for connection
    await app.startAllMicroservices();
    // Wait a bit for RabbitMQ consumers to be fully registered
    console.log('🍕 RESTAURANTS SERVICE | 🔄 Waiting for RabbitMQ consumers to initialize...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('🍕 RESTAURANTS SERVICE | ✅ RabbitMQ consumers ready');
    await app.listen(4001);
    console.log('🍕 RESTAURANTS SERVICE | 🚀 Starting Restaurants Service...');
    console.log('🍕 RESTAURANTS SERVICE | ✅ Restaurants Service is running on port 4001');
    console.log('🍕 RESTAURANTS SERVICE | 🌐 GraphQL Playground: http://localhost:4001/graphql');
    console.log('🍕 RESTAURANTS SERVICE | 🐰 RabbitMQ: Connected');
    console.log('🍕 RESTAURANTS SERVICE | 📋 RabbitMQ Handlers:');
    console.log('   - restaurant.validate');
    console.log('   - menu.validateItems');
    console.log('🍕 RESTAURANTS SERVICE | 🏪 Restaurant Management: Ready');
    console.log('🍕 RESTAURANTS SERVICE | 🍔 Menu Management: Ready');
    console.log('🍕 RESTAURANTS SERVICE | 📸 Image Upload: Ready');
    console.log('🍕 RESTAURANTS SERVICE | ⭐ Reviews & Ratings: Ready');
    console.log('🍕 RESTAURANTS SERVICE | 🔧 Environment: ' + (process.env.NODE_ENV || 'development'));
    console.log('🍕 RESTAURANTS SERVICE | 🏷️ Service: restaurants-service');
    console.log('============================================================');
}
bootstrap();

})();

var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;