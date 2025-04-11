package main

import (
	"emoji-game/models"
	"emoji-game/routes"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// 全局数据库连接
var db *gorm.DB

func main() {
	// 初始化数据库连接
	var err error
	db, err = gorm.Open(sqlite.Open("emoji.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 自动迁移数据库表
	err = db.AutoMigrate(&models.Word{}, &models.GameRecord{}, &models.Leaderboard{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	routes.SetDB(db)

	// 初始化Gin路由
	r := gin.Default()

	// 配置CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 静态文件服务
	r.Static("/static", "./static")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")

	// API路由组
	api := r.Group("/api")
	{
		// 词语相关路由
		words := api.Group("/words")
		{
			words.GET("/random", routes.GetRandomWord)
			words.GET("/batch", routes.GetRandomWords)
			words.GET("/:id", routes.GetWordByID)
		}

		// 游戏相关路由
		game := api.Group("/game")
		{
			game.POST("/guess", routes.SubmitGuess)
		}

		// 统计相关路由
		api.GET("/statistics", routes.GetStatistics)

		// 排行榜相关路由
		leaderboard := api.Group("/leaderboard")
		{
			leaderboard.GET("", routes.GetLeaderboard)
			leaderboard.POST("", routes.AddLeaderboardEntry)
		}
	}

	// 前端路由处理
	r.NoRoute(func(c *gin.Context) {
		// 检查请求的文件是否存在
		path := c.Request.URL.Path
		filePath := filepath.Join("./static", path)
		if _, err := os.Stat(filePath); err == nil {
			c.File(filePath)
			return
		}
		// 如果文件不存在，返回index.html
		c.File("./static/index.html")
	})

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	err = r.Run(":" + port)
	if err != nil {
		panic(err)
	}
}
