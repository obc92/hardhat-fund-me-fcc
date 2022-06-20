const { inputToConfig } = require("@ethereum-waffle/compiler")
const { assert, expect } = require("chai")
const { formatUnits } = require("ethers/lib/utils")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//Aquest es el codi de test fora de rinkeby
!developmentChains.includes(network.name) 
    ? describe.skip
    : describe("FundMe", async function () {
        let fundMe
        let deployer
        let mockV3Aggregator
        const sendValue = ethers.utils.parseEther("0.1")
        beforeEach(async function () {//Executes before everything doing the deploy
            
            deployer = (await getNamedAccounts()).deployer//
            await deployments.fixture(["all"])
            fundMe = await ethers.getContract("FundMe", deployer)//Gives recent deployed fundme contract
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
        })

        describe("constructor", async function () {
            it("sets the aggregator addresses correctly", async function () {
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
            })
        })

        describe("fund", async function () {
            it("Fails if you don't send enough ETH", async function () {
                await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
                )
            })
            it("Updates the amount funded data structure", async function () {
                await fundMe.fund({ value: sendValue })
                const response = await fundMe.getaddressToAmountFunded(deployer)
                assert.equal(response.toString(), sendValue.toString())
            })
            it("Adds funder to array of funders", async function () {
                await fundMe.fund({ value: sendValue })
                const funder = await fundMe.getFunder(0)
                assert.equal(funder, deployer)
            })
        })
        describe("withdraw", async function () {
            beforeEach(async function() {
                await fundMe.fund({value: sendValue })
            })
            it("Withdrawing funds", async function () {
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)//Balance de la adreça del contract diria
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
                //Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)//Balance de la adreça del contract diria
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
                //gasCost

                assert.equal(endingFundMeBalance, 0)// COndicio que el balance final es 0
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())//.add(gasCost).toString()
            })
            it("allows us to withdraw with multiple funders", async function () {
                //Arrenge
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(accounts[i])
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                //Act
                const transactionResponse = await fundMe.withdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                //Assert Assegura que el fund esta a 0 despres de treure i calersfund + calersDeployer = CalersFinalsDeployer

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)//Balance de la adreça del contract diria
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
                //gasCost

                assert.equal(endingFundMeBalance, 0)// COndicio que el balance final es 0
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())

                // Make a getter for storage variables
                //await expect(fundMe.funders(0)).to.be.reverted

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getaddressToAmountFunded(accounts[i].address),0)
                }
            })
            it("Only allows the owner to withdraw", async function(){
                const accounts = await ethers.getSigners()
                const attacker = accounts[1]
                const attackerConnectedContract = await fundMe.connect(attacker)
                await expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FoundMe_NotOwner")
            })

            it("Cheaper withdraw testing", async function () {
                //Arrenge
                const accounts = await ethers.getSigners()
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(accounts[i])
                    await fundMeConnectedContract.fund({ value: sendValue })
                }
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

                //Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                //Assert Assegura que el fund esta a 0 despres de treure i calersfund + calersDeployer = CalersFinalsDeployer

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)//Balance de la adreça del contract diria
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
                //gasCost

                assert.equal(endingFundMeBalance, 0)// COndicio que el balance final es 0
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())

                // Make a getter for storage variables
                //await expect(fundMe.funders(0)).to.be.reverted

                for (i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getaddressToAmountFunded(accounts[i].address),0)
                }
            })
            it("Withdrawing funds", async function () {
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)//Balance de la adreça del contract diria
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
                //Act
                const transactionResponse = await fundMe.cheaperWithdraw()
                const transactionReceipt = await transactionResponse.wait(1)

                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)//Balance de la adreça del contract diria
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
                //gasCost

                assert.equal(endingFundMeBalance, 0)// COndicio que el balance final es 0
                assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())//.add(gasCost).toString()
            })
        })
    })