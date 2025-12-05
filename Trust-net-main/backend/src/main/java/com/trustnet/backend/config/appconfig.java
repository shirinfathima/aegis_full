package com.trustnet.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.web3j.protocol.Web3j; 
import org.web3j.protocol.http.HttpService;

@Configuration
public class appconfig {
    // Polygon Amoy RPC URL
    private static final String AMOY_RPC_URL = "https://rpc-amoy.polygon.technology/";

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    // Creates the Web3j instance connected to the Amoy network
    @Bean
    public Web3j web3j() {
        return Web3j.build(new HttpService(AMOY_RPC_URL));
    }
}
