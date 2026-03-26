/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersModule = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const graphql_1 = __webpack_require__(7);
const apollo_1 = __webpack_require__(8);
const config_1 = __webpack_require__(9);
const jwt_1 = __webpack_require__(10);
const user_resolver_1 = __webpack_require__(11);
const email_module_1 = __webpack_require__(26);
const user_service_1 = __webpack_require__(21);
const user_controller_1 = __webpack_require__(28);
const prisma_service_1 = __webpack_require__(17);
const shared_module_1 = __webpack_require__(29);
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloFederationDriver,
                autoSchemaFile: {
                    federation: 2,
                },
                includeStacktraceInErrorResponses: false,
            }),
            email_module_1.EmailModule,
            shared_module_1.SharedModule,
        ],
        controllers: [user_controller_1.UsersController],
        providers: [
            user_service_1.UsersService,
            config_1.ConfigService,
            jwt_1.JwtService,
            prisma_service_1.PrismaService,
            user_resolver_1.UsersResolver,
        ],
    })
], UsersModule);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/graphql");

/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/apollo");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersResolver = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const graphql_1 = __webpack_require__(7);
const user_types_1 = __webpack_require__(12);
const user_dto_1 = __webpack_require__(14);
const auth_guard_1 = __webpack_require__(16);
const user_service_1 = __webpack_require__(21);
const user_entities_1 = __webpack_require__(13);
let UsersResolver = class UsersResolver {
    constructor(userService) {
        this.userService = userService;
    }
    async register(registerDto, context) {
        if (!registerDto.name || !registerDto.email || !registerDto.password) {
            throw new common_1.BadRequestException('Please fill the all fields');
        }
        const { activation_token } = await this.userService.register(registerDto, context.res);
        return { activation_token };
    }
    async activateUser(activationDto, context) {
        return await this.userService.activateUser(activationDto, context.res);
    }
    async Login(email, password) {
        return await this.userService.Login({ email, password });
    }
    async getLoggedInUser(context) {
        return await this.userService.getLoggedInUser(context.req);
    }
    async forgotPassword(forgotPasswordDto) {
        return await this.userService.forgotPassword(forgotPasswordDto);
    }
    async resetPassword(resetPasswordDto) {
        return await this.userService.resetPassword(resetPasswordDto);
    }
    async logOutUser(context) {
        return await this.userService.Logout(context.req);
    }
    async getUsers() {
        return this.userService.getUsers();
    }
    async getUserById(userId) {
        const result = await this.userService.getUserById({ userId });
        if (!result.user) {
            throw new common_1.BadRequestException(result.error || 'User not found');
        }
        return result.user;
    }
};
exports.UsersResolver = UsersResolver;
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => user_types_1.RegisterResponse),
    tslib_1.__param(0, (0, graphql_1.Args)('registerDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof user_dto_1.RegisterDto !== "undefined" && user_dto_1.RegisterDto) === "function" ? _b : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], UsersResolver.prototype, "register", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => user_types_1.ActivationResponse),
    tslib_1.__param(0, (0, graphql_1.Args)('activationDto')),
    tslib_1.__param(1, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_d = typeof user_dto_1.ActivationDto !== "undefined" && user_dto_1.ActivationDto) === "function" ? _d : Object, Object]),
    tslib_1.__metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], UsersResolver.prototype, "activateUser", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => user_types_1.LoginResponse),
    tslib_1.__param(0, (0, graphql_1.Args)('email')),
    tslib_1.__param(1, (0, graphql_1.Args)('password')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String]),
    tslib_1.__metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], UsersResolver.prototype, "Login", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => user_types_1.LoginResponse),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], UsersResolver.prototype, "getLoggedInUser", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => user_types_1.ForgotPasswordResponse),
    tslib_1.__param(0, (0, graphql_1.Args)('forgotPasswordDto')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_g = typeof user_dto_1.ForgotPasswordDto !== "undefined" && user_dto_1.ForgotPasswordDto) === "function" ? _g : Object]),
    tslib_1.__metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], UsersResolver.prototype, "forgotPassword", null);
tslib_1.__decorate([
    (0, graphql_1.Mutation)(() => user_types_1.ResetPasswordResponse),
    tslib_1.__param(0, (0, graphql_1.Args)('resetPasswordDto')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_j = typeof user_dto_1.ResetPasswordDto !== "undefined" && user_dto_1.ResetPasswordDto) === "function" ? _j : Object]),
    tslib_1.__metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], UsersResolver.prototype, "resetPassword", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => user_types_1.LogoutResposne),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__param(0, (0, graphql_1.Context)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], UsersResolver.prototype, "logOutUser", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => [user_entities_1.User]),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], UsersResolver.prototype, "getUsers", null);
tslib_1.__decorate([
    (0, graphql_1.Query)(() => user_entities_1.User),
    tslib_1.__param(0, (0, graphql_1.Args)('userId')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", Promise)
], UsersResolver.prototype, "getUserById", null);
exports.UsersResolver = UsersResolver = tslib_1.__decorate([
    (0, graphql_1.Resolver)('User')
    // @UseFilters
    ,
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof user_service_1.UsersService !== "undefined" && user_service_1.UsersService) === "function" ? _a : Object])
], UsersResolver);


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ResetPasswordResponse = exports.ForgotPasswordResponse = exports.LogoutResposne = exports.LoginResponse = exports.ActivationResponse = exports.RegisterResponse = exports.ErrorType = void 0;
const tslib_1 = __webpack_require__(6);
const graphql_1 = __webpack_require__(7);
const user_entities_1 = __webpack_require__(13);
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
    (0, graphql_1.Field)(() => user_entities_1.User),
    tslib_1.__metadata("design:type", Object)
], ActivationResponse.prototype, "user", void 0);
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
    (0, graphql_1.Field)(() => user_entities_1.User, { nullable: true }),
    tslib_1.__metadata("design:type", Object)
], LoginResponse.prototype, "user", void 0);
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
let LogoutResposne = class LogoutResposne {
};
exports.LogoutResposne = LogoutResposne;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], LogoutResposne.prototype, "message", void 0);
exports.LogoutResposne = LogoutResposne = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], LogoutResposne);
let ForgotPasswordResponse = class ForgotPasswordResponse {
};
exports.ForgotPasswordResponse = ForgotPasswordResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], ForgotPasswordResponse.prototype, "message", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], ForgotPasswordResponse.prototype, "error", void 0);
exports.ForgotPasswordResponse = ForgotPasswordResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], ForgotPasswordResponse);
let ResetPasswordResponse = class ResetPasswordResponse {
};
exports.ResetPasswordResponse = ResetPasswordResponse;
tslib_1.__decorate([
    (0, graphql_1.Field)(() => user_entities_1.User),
    tslib_1.__metadata("design:type", Object)
], ResetPasswordResponse.prototype, "user", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(() => ErrorType, { nullable: true }),
    tslib_1.__metadata("design:type", ErrorType)
], ResetPasswordResponse.prototype, "error", void 0);
exports.ResetPasswordResponse = ResetPasswordResponse = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], ResetPasswordResponse);


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.User = exports.Avatars = void 0;
const tslib_1 = __webpack_require__(6);
const graphql_1 = __webpack_require__(7);
let Avatars = class Avatars {
};
exports.Avatars = Avatars;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Avatars.prototype, "id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Avatars.prototype, "public_id", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Avatars.prototype, "url", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], Avatars.prototype, "userId", void 0);
exports.Avatars = Avatars = tslib_1.__decorate([
    (0, graphql_1.ObjectType)(),
    (0, graphql_1.Directive)('@key(fields:"id")')
], Avatars);
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
    (0, graphql_1.Field)(() => Avatars, { nullable: true }),
    tslib_1.__metadata("design:type", Avatars)
], User.prototype, "avatar", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", String)
], User.prototype, "role", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], User.prototype, "address", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    tslib_1.__metadata("design:type", Number)
], User.prototype, "phone_number", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], User.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    tslib_1.__metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], User.prototype, "updatedAt", void 0);
exports.User = User = tslib_1.__decorate([
    (0, graphql_1.ObjectType)()
], User);


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.LoginDto = exports.ActivationDto = exports.RegisterDto = void 0;
const tslib_1 = __webpack_require__(6);
const graphql_1 = __webpack_require__(7);
const class_validator_1 = __webpack_require__(15);
let RegisterDto = class RegisterDto {
};
exports.RegisterDto = RegisterDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Name is required.' }),
    (0, class_validator_1.IsString)({ message: 'Name must need to be one string.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required.' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required.' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email is invalid.' }),
    tslib_1.__metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Phone Number is required.' }),
    tslib_1.__metadata("design:type", Number)
], RegisterDto.prototype, "phone_number", void 0);
exports.RegisterDto = RegisterDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], RegisterDto);
let ActivationDto = class ActivationDto {
};
exports.ActivationDto = ActivationDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Activation Token is required.' }),
    tslib_1.__metadata("design:type", String)
], ActivationDto.prototype, "activationToken", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Activation Code is required.' }),
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
    (0, class_validator_1.IsEmail)({}, { message: 'Email must be valid.' }),
    tslib_1.__metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required.' }),
    tslib_1.__metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
exports.LoginDto = LoginDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], LoginDto);
let ForgotPasswordDto = class ForgotPasswordDto {
};
exports.ForgotPasswordDto = ForgotPasswordDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email is required.' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email must be valid.' }),
    tslib_1.__metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
exports.ForgotPasswordDto = ForgotPasswordDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], ForgotPasswordDto);
let ResetPasswordDto = class ResetPasswordDto {
};
exports.ResetPasswordDto = ResetPasswordDto;
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password is required.' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters.' }),
    tslib_1.__metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
tslib_1.__decorate([
    (0, graphql_1.Field)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Activation Token is required.' }),
    tslib_1.__metadata("design:type", String)
], ResetPasswordDto.prototype, "activationToken", void 0);
exports.ResetPasswordDto = ResetPasswordDto = tslib_1.__decorate([
    (0, graphql_1.InputType)()
], ResetPasswordDto);


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthGuard = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const graphql_1 = __webpack_require__(7);
const jwt_1 = __webpack_require__(10);
const config_1 = __webpack_require__(9);
const prisma_service_1 = __webpack_require__(17);
const redis_service_1 = __webpack_require__(19);
let AuthGuard = class AuthGuard {
    constructor(jwtService, prisma, config, redisService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.config = config;
        this.redisService = redisService;
    }
    async canActivate(context) {
        const gqlContext = graphql_1.GqlExecutionContext.create(context);
        const { req } = gqlContext.getContext();
        const accessToken = req.headers.accesstoken;
        const refreshToken = req.headers.refreshtoken;
        if (!accessToken || !refreshToken) {
            throw new common_1.UnauthorizedException('Please login to access this resource!');
        }
        // Check if token is blacklisted (logged out)
        const isBlacklisted = await this.redisService.exists(`bl:${accessToken}`);
        if (isBlacklisted) {
            throw new common_1.UnauthorizedException('Token has been revoked. Please login again.');
        }
        try {
            const decoded = this.jwtService.verify(accessToken, {
                secret: this.config.get('ACCESS_TOKEN_SECRET'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.id },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found!');
            }
            req.accesstoken = accessToken;
            req.refreshtoken = refreshToken;
            req.user = user;
            return true;
        }
        catch (error) {
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
            // Check if refresh token is blacklisted
            const isBlacklisted = await this.redisService.exists(`bl:${refreshTokenData}`);
            if (isBlacklisted) {
                throw new common_1.UnauthorizedException('Session revoked. Please login again.');
            }
            const decoded = this.jwtService.verify(refreshTokenData, {
                secret: this.config.get('REFRESH_TOKEN_SECRET'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.id },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found!');
            }
            const accessToken = this.jwtService.sign({ id: user.id, email: user.email, role: user.role }, {
                secret: this.config.get('ACCESS_TOKEN_SECRET'),
                expiresIn: '15m',
            });
            const refreshToken = this.jwtService.sign({ id: user.id }, {
                secret: this.config.get('REFRESH_TOKEN_SECRET'),
                expiresIn: '7d',
            });
            req.accesstoken = accessToken;
            req.refreshtoken = refreshToken;
            req.user = user;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Session expired. Please login again!');
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _d : Object])
], AuthGuard);


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const client_1 = __webpack_require__(18);
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
/* 18 */
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(20);
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
/* 20 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var UsersService_1;
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const jwt_1 = __webpack_require__(10);
const bcrypt = tslib_1.__importStar(__webpack_require__(22));
const email_service_1 = __webpack_require__(23);
const sendToken_1 = __webpack_require__(25);
const prisma_service_1 = __webpack_require__(17);
const redis_service_1 = __webpack_require__(19);
let UsersService = UsersService_1 = class UsersService {
    constructor(jwtService, prisma, configService, emailService, redisService) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.configService = configService;
        this.emailService = emailService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    // register user service
    async register(registerDto, response) {
        const { name, email, password, phone_number } = registerDto;
        const isEmailExist = await this.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (isEmailExist) {
            throw new common_1.BadRequestException('Unable to process registration. Please try with different credentials.');
        }
        const phoneNumbersToCheck = [phone_number];
        const usersWithPhoneNumber = await this.prisma.user.findMany({
            where: {
                phone_number: {
                    not: null,
                    in: phoneNumbersToCheck,
                },
            },
        });
        if (usersWithPhoneNumber.length > 0) {
            throw new common_1.BadRequestException('Unable to process registration. Please try with different credentials.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            name,
            email,
            password: hashedPassword,
            phone_number,
        };
        const activationToken = await this.createActivationToken(user);
        const activationCode = activationToken.activationCode;
        const activation_token = activationToken.token;
        try {
            await this.emailService.sendMail({
                email,
                subject: 'Activate your account!',
                template: './activation-mail',
                name,
                activationCode,
            });
            this.logger.log(`✅ Activation email sent to ${email}`);
        }
        catch (error) {
            this.logger.warn(`⚠️ Failed to send email, but user registration continues. Code: ${activationCode}`);
        }
        return { activation_token, response };
    }
    // create activation token
    async createActivationToken(user) {
        const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
        // Store user data (including password) in Redis, NOT in the JWT
        const registrationId = `reg:${user.email}:${Date.now()}`;
        await this.redisService.set(registrationId, JSON.stringify(user), 600);
        const token = this.jwtService.sign({
            registrationId,
            email: user.email,
            activationCode,
        }, {
            secret: this.configService.get('ACTIVATION_SECRET'),
            expiresIn: '10m',
        });
        return { token, activationCode };
    }
    // activation user
    async activateUser(activationDto, response) {
        const { activationToken, activationCode } = activationDto;
        const decoded = this.jwtService.verify(activationToken, {
            secret: this.configService.get('ACTIVATION_SECRET'),
        });
        if (decoded.activationCode !== activationCode) {
            throw new common_1.BadRequestException('Invalid activation code');
        }
        // Retrieve user data from Redis
        const userData = await this.redisService.get(decoded.registrationId);
        if (!userData) {
            throw new common_1.BadRequestException('Activation token expired. Please register again.');
        }
        const { name, email, password, phone_number } = JSON.parse(userData);
        const existUser = await this.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (existUser) {
            throw new common_1.BadRequestException('User already activated.');
        }
        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password,
                phone_number,
            },
        });
        // Clean up Redis after successful activation
        await this.redisService.del(decoded.registrationId);
        return { user, response };
    }
    // Login service
    async Login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (user && (await this.comparePassword(password, user.password))) {
            const tokenSender = new sendToken_1.TokenSender(this.configService, this.jwtService);
            return tokenSender.sendToken(user);
        }
        else {
            return {
                user: undefined,
                accessToken: undefined,
                refreshToken: undefined,
                error: {
                    message: 'Invalid email or password',
                },
            };
        }
    }
    // compare with hashed password
    async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
    // generate forgot password link
    async generateForgotPasswordLink(user) {
        const forgotPasswordToken = this.jwtService.sign({
            user,
        }, {
            secret: this.configService.get('FORGOT_PASSWORD_SECRET'),
            expiresIn: '5m',
        });
        return forgotPasswordToken;
    }
    // forgot password
    async forgotPassword(forgotPasswordDto) {
        const { email } = forgotPasswordDto;
        const user = await this.prisma.user.findUnique({
            where: {
                email,
            },
        });
        // Always return success to prevent account enumeration
        if (!user) {
            return { message: 'If an account with that email exists, a reset link has been sent.' };
        }
        const forgotPasswordToken = await this.generateForgotPasswordLink(user);
        const resetPasswordUrl = this.configService.get('CLIENT_SIDE_URI') +
            `/reset-password?verify=${forgotPasswordToken}`;
        await this.emailService.sendMail({
            email,
            subject: 'Reset your Password!',
            template: './forgot-password',
            name: user.name,
            activationCode: resetPasswordUrl,
        });
        return { message: 'If an account with that email exists, a reset link has been sent.' };
    }
    // reset password
    async resetPassword(resetPasswordDto) {
        const { password, activationToken } = resetPasswordDto;
        let decoded;
        try {
            decoded = this.jwtService.verify(activationToken, {
                secret: this.configService.get('FORGOT_PASSWORD_SECRET'),
            });
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid or expired reset token!');
        }
        if (!decoded) {
            throw new common_1.BadRequestException('Invalid token!');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.update({
            where: {
                id: decoded.user.id,
            },
            data: {
                password: hashedPassword,
            },
        });
        return { user };
    }
    // get logged in user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getLoggedInUser(req) {
        const user = req.user;
        const refreshToken = req.refreshtoken;
        const accessToken = req.accesstoken;
        return { user, refreshToken, accessToken };
    }
    // log out user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async Logout(req) {
        const accessToken = req.accesstoken;
        const refreshToken = req.refreshtoken;
        // Blacklist both tokens in Redis until they expire
        if (accessToken) {
            try {
                const decoded = this.jwtService.decode(accessToken);
                if (decoded?.exp) {
                    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                    if (ttl > 0) {
                        await this.redisService.set(`bl:${accessToken}`, '1', ttl);
                    }
                }
            }
            catch (e) { /* token already invalid, nothing to blacklist */ }
        }
        if (refreshToken) {
            try {
                const decoded = this.jwtService.decode(refreshToken);
                if (decoded?.exp) {
                    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                    if (ttl > 0) {
                        await this.redisService.set(`bl:${refreshToken}`, '1', ttl);
                    }
                }
            }
            catch (e) { /* token already invalid */ }
        }
        req.user = null;
        req.refreshtoken = null;
        req.accesstoken = null;
        return { message: 'Logged out successfully!' };
    }
    // get all users service
    async getUsers() {
        return this.prisma.user.findMany({});
    }
    // Validate user for Orders Service (RabbitMQ handler)
    async validateUser(data) {
        this.logger.log(`🔍 Validating user: ${data.userId}`);
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: data.userId },
            });
            if (!user) {
                return {
                    isValid: false,
                    error: 'User not found',
                };
            }
            const response = {
                isValid: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone_number: user.phone_number,
                },
            };
            return response;
        }
        catch (error) {
            this.logger.error(`❌ User validation failed: ${error.message}`);
            return {
                isValid: false,
                error: 'Validation failed',
            };
        }
    }
    // Get user by ID (used by both GraphQL resolver and RabbitMQ handler)
    async getUserById(data) {
        this.logger.log(`📋 Getting user by ID: ${data.userId}`);
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: data.userId },
                include: { avatar: true },
            });
            if (!user) {
                return { user: null, error: 'User not found' };
            }
            return { user };
        }
        catch (error) {
            this.logger.error(`❌ Get user failed: ${error.message}`);
            return { user: null, error: 'Failed to get user' };
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _d : Object, typeof (_e = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _e : Object])
], UsersService);


/***/ }),
/* 22 */
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailService = void 0;
const tslib_1 = __webpack_require__(6);
const mailer_1 = __webpack_require__(24);
const common_1 = __webpack_require__(3);
let EmailService = class EmailService {
    constructor(mailService) {
        this.mailService = mailService;
    }
    async sendMail({ subject, email, name, activationCode, template, }) {
        await this.mailService.sendMail({
            to: email,
            subject,
            template,
            context: {
                name,
                activationCode,
            },
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof mailer_1.MailerService !== "undefined" && mailer_1.MailerService) === "function" ? _a : Object])
], EmailService);


/***/ }),
/* 24 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/mailer");

/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokenSender = void 0;
class TokenSender {
    constructor(config, jwt) {
        this.config = config;
        this.jwt = jwt;
    }
    sendToken(user) {
        const accessToken = this.jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
        }, {
            secret: this.config.get('ACCESS_TOKEN_SECRET'),
            expiresIn: '15m', // 15 minutes for testing (use 5m in production)
        });
        const refreshToken = this.jwt.sign({
            id: user.id,
        }, {
            secret: this.config.get('REFRESH_TOKEN_SECRET'),
            expiresIn: '7d', // 7 days
        });
        return { user, accessToken, refreshToken };
    }
}
exports.TokenSender = TokenSender;


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailModule = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const email_service_1 = __webpack_require__(23);
const mailer_1 = __webpack_require__(24);
const config_1 = __webpack_require__(9);
const path_1 = __webpack_require__(4);
const ejs_adapter_1 = __webpack_require__(27);
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mailer_1.MailerModule.forRootAsync({
                useFactory: async (config) => {
                    const transportConfig = {
                        host: config.get('SMTP_HOST'),
                        secure: true,
                        auth: {
                            user: config.get('SMTP_MAIL'),
                            pass: config.get('SMTP_PASSWORD'),
                        },
                    };
                    // Custom log after transporter is created
                    setTimeout(() => {
                        common_1.Logger.log('Transporter is ready', 'MailerService');
                    }, 1000);
                    return {
                        transport: transportConfig,
                        defaults: {
                            from: 'Becodemy',
                        },
                        template: {
                            dir: (0, path_1.join)(__dirname, '../../../apps/api-users/email-templates'),
                            adapter: new ejs_adapter_1.EjsAdapter(),
                            options: {
                                strict: false,
                            },
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [email_service_1.EmailService],
        exports: [email_service_1.EmailService],
    })
], EmailModule);


/***/ }),
/* 27 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/mailer/dist/adapters/ejs.adapter");

/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var UsersController_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersController = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(2);
const common_2 = __webpack_require__(3);
const user_service_1 = __webpack_require__(21);
let UsersController = UsersController_1 = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
        this.logger = new common_2.Logger(UsersController_1.name);
    }
    async validateUser(data) {
        this.logger.log(`Received data: ${JSON.stringify(data)}`);
        const payload = data.userId ? data : (data.data || data);
        return await this.usersService.validateUser(payload);
    }
    async getUserById(data) {
        this.logger.log(`Received data: ${JSON.stringify(data)}`);
        const payload = data.userId ? data : (data.data || data);
        return await this.usersService.getUserById(payload);
    }
};
exports.UsersController = UsersController;
tslib_1.__decorate([
    (0, microservices_1.MessagePattern)('user.validate'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], UsersController.prototype, "validateUser", null);
tslib_1.__decorate([
    (0, microservices_1.MessagePattern)('user.get_by_id'),
    tslib_1.__param(0, (0, microservices_1.Payload)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
exports.UsersController = UsersController = UsersController_1 = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof user_service_1.UsersService !== "undefined" && user_service_1.UsersService) === "function" ? _a : Object])
], UsersController);


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SharedModule = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const microservices_module_1 = __webpack_require__(30);
const redis_module_1 = __webpack_require__(31);
const rabbitmq_service_1 = __webpack_require__(32);
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
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SharedMicroservicesModule = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(2);
const config_1 = __webpack_require__(9);
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
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisModule = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const ioredis_1 = __webpack_require__(20);
const redis_service_1 = __webpack_require__(19);
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
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RabbitMQService = void 0;
const tslib_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(2);
const rxjs_1 = __webpack_require__(33);
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
/* 33 */
/***/ ((module) => {

module.exports = require("rxjs");

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
const core_1 = __webpack_require__(1);
const microservices_1 = __webpack_require__(2);
const common_1 = __webpack_require__(3);
const path_1 = __webpack_require__(4);
const user_module_1 = __webpack_require__(5);
async function bootstrap() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║ 👥 USERS SERVICE                                           ║
║ User Authentication & Management System                      ║
╚══════════════════════════════════════════════════════════════╝`);
    const app = await core_1.NestFactory.create(user_module_1.UsersModule);
    // Global validation pipe — enforces class-validator decorators on all DTOs
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true, // Strip properties not in DTO
        forbidNonWhitelisted: true, // Throw if unknown properties sent
        transform: true, // Auto-transform payloads to DTO instances
    }));
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
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'));
    app.setBaseViewsDir((0, path_1.join)(__dirname, '..', 'email-templates'));
    app.setViewEngine('ejs');
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
    console.log('👥 USERS SERVICE | 🔄 Waiting for RabbitMQ consumers to initialize...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('👥 USERS SERVICE | ✅ RabbitMQ consumers ready');
    await app.listen(3000);
    console.log('👥 USERS SERVICE | 🚀 Starting Users Service...');
    console.log('👥 USERS SERVICE | ✅ Users Service is running on port 3000');
    console.log('👥 USERS SERVICE | 🌐 GraphQL Playground: http://localhost:3000/graphql');
    console.log('👥 USERS SERVICE | 🐰 RabbitMQ: Connected');
    console.log('👥 USERS SERVICE | 🔐 Authentication: Ready');
    console.log('👥 USERS SERVICE | 📝 Registration: Ready');
    console.log('👥 USERS SERVICE | 📧 Email Service: Ready');
    console.log('👥 USERS SERVICE | 🔑 Password Reset: Ready');
    console.log('👥 USERS SERVICE | 🔧 Environment: ' + (process.env.NODE_ENV || 'development'));
    console.log('👥 USERS SERVICE | 🏷️ Service: users-service');
    console.log('============================================================');
}
bootstrap();

})();

var __webpack_export_target__ = exports;
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;