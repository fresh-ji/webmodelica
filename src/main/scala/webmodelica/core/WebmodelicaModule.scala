package webmodelica.core

import com.softwaremill.macwire._
import com.typesafe.scalalogging.LazyLogging
import org.mongodb.scala._
import webmodelica.ApiPrefix
import webmodelica.models._
import webmodelica.models.config._
import webmodelica.services._
import webmodelica.stores._

trait ConfigModule
    extends LazyLogging {
  def arguments:Seq[String]
  lazy val args = wire[ArgsParser]
  lazy val config:WMConfig = {
    import com.typesafe.config.ConfigFactory
    import webmodelica.models.config.WMConfig
    import webmodelica.models.config.configReaders._
    import pureconfig.generic.auto._
    val rootConfig = args.configFile.toOption match {
      case Some(file) => ConfigFactory.parseFile(file)
      case None => ConfigFactory.load("webmodelica.conf")
    }
    val conf = pureconfig.loadConfigOrThrow[WMConfig](rootConfig.getConfig(args.env()))
    logger.info(s"config loaded: $conf")
    conf
  }

  def dbConfig: MongoDBConfig = config.mongodb
  def mopeConfig: MopeClientConfig = config.mope
  def jwtConf: JwtConf = config.jwtConf
  def maxSimulationData: MaxSimulationData = config.maxSimulationData
  def userConf: UserServiceConf = config.userService
  def redisConf:RedisConfig = config.redis
}

trait MongoDBModule
    extends webmodelica.models.DocumentWriters {
  this: ConfigModule =>
  lazy val mongoClient: MongoClient = MongoClient(dbConfig.address)
  lazy val mongoDB: MongoDatabase = {
    mongoClient.getDatabase(dbConfig.database)
      .withCodecRegistry(codecRegistry)
  }
}

trait AkkaModule {
  private val akkaConfig = com.typesafe.config.ConfigFactory.load("akka.conf")
  implicit lazy val actorSystem = akka.actor.ActorSystem(s"${buildinfo.BuildInfo.name}-system", akkaConfig)
  implicit lazy val materializer = akka.stream.ActorMaterializer()
  implicit def execContext = actorSystem.dispatcher
}

trait WebmodelicaModule
    extends ConfigModule
    with MongoDBModule
    with AkkaModule {
  lazy val noOpReceiver = new com.twitter.finagle.stats.NullStatsReceiver()
  def prefixProvider: ApiPrefix = ApiPrefix("/api/v1/webmodelica")

  def userStore = {
    val store = wire[UserServiceProxy]
    if(config.cacheUsers) {
      logger.info(s"caching users enabled")
      wire[UserService]
    } else {
      logger.info(s"caching users disabled")
      store
    }
  }
  def projectStore:ProjectStore = wire[ProjectStore]

  lazy val sessionRegistry:SessionRegistry = {
    if(config.redisSessions) {
      logger.info(s"save sessions into redis")
      wire[RedisSessionRegistry]
    } else {
      logger.info(s"save sessions inmemory")
      wire[InMemorySessionRegistry]
    }
  }
  def tokenGenerator: TokenGenerator =
    new TokenGenerator(jwtConf.secret, jwtConf.tokenExpiration)
  def tokenValidator: CombinedTokenValidator =
    TokenValidator.combine(tokenGenerator, AuthTokenValidator(KeyFile(jwtConf.authSvcPublicKey)))
}