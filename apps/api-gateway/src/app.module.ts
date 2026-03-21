import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose } from '@apollo/gateway';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            {
              name: 'users',
              url: 'http://localhost:3000/graphql',
            },
            {
              name: 'restaurants',
              url: 'http://localhost:4001/graphql',
            },
            {
              name: 'orders',
              url: 'http://localhost:4002/graphql',
            },
            {
              name: 'analytics',
              url: 'http://localhost:4003/graphql',
            },
            {
              name: 'reservations',
              url: 'http://localhost:4004/graphql',
            },
          ],
        }),
      },
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}