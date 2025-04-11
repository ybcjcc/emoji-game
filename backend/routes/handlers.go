package routes

import (
	"emoji-game/models"
	"fmt"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"strconv"
)

// 全局数据库连接
var db *gorm.DB

// SetDB 设置数据库连接
func SetDB(database *gorm.DB) {
	db = database
}

// GetRandomWord 获取随机词语
func GetRandomWord(c *gin.Context) {
	var word models.Word
	// 获取难度参数
	difficulty := c.DefaultQuery("difficulty", "1")

	// 根据难度筛选并随机获取一个词语
	result := db.Where("difficulty = ?", difficulty).Order("RANDOM()").First(&word)
	fmt.Println(result)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No words found"})
		return
	}

	c.JSON(http.StatusOK, word)
}

// GetRandomWords 获取指定数量的随机词语
func GetRandomWords(c *gin.Context) {
	difficulty := c.Query("difficulty")
	count := 10 // 默认简单模式10道题

	switch difficulty {
	case "2":
		count = 20 // 中等模式20道题
	case "3":
		count = 30 // 困难模式30道题
	}

	var words []models.Word
	result := db.Where("difficulty = ?", difficulty).Order("RANDOM()").Limit(count).Find(&words)

	if result.Error != nil {
		c.JSON(500, gin.H{"error": "获取词语失败"})
		return
	}

	c.JSON(200, words)
}

// GetWordByID 根据ID获取词语
func GetWordByID(c *gin.Context) {
	var word models.Word
	id := c.Param("id")

	result := db.First(&word, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Word not found"})
		return
	}

	c.JSON(http.StatusOK, word)
}

// SubmitGuess 提交猜测结果
func SubmitGuess(c *gin.Context) {
	var guess struct {
		WordID    uint   `json:"word_id" binding:"required"`
		Guess     string `json:"guess" binding:"required"`
		UserID    string `json:"user_id" binding:"required"`
		GuessTime int    `json:"guess_time" binding:"required"`
	}

	if err := c.ShouldBindJSON(&guess); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取正确答案
	var word models.Word
	if err := db.First(&word, guess.WordID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Word not found"})
		return
	}

	// 创建游戏记录
	record := models.GameRecord{
		WordID:    guess.WordID,
		UserID:    guess.UserID,
		IsCorrect: guess.Guess == word.Word,
		GuessTime: guess.GuessTime,
	}

	if err := db.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save game record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_correct": record.IsCorrect,
		"answer":     word.Word,
	})
}

// GetStatistics 获取游戏统计信息
func GetStatistics(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	var stats struct {
		TotalGames     int64   `json:"total_games"`
		CorrectGames   int64   `json:"correct_games"`
		AverageGuesses float64 `json:"average_guesses"`
		HighestScore   int     `json:"highest_score"`
		TotalScore     int     `json:"total_score"`
		GamesPlayed    int     `json:"games_played"`
		WinRate        float64 `json:"win_rate"`
		AverageScore   float64 `json:"average_score"`
		BestDifficulty int     `json:"best_difficulty"`
		LastPlayed     string  `json:"last_played"`
	}

	// 获取总游戏次数（所有游戏记录）
	db.Model(&models.GameRecord{}).Where("user_id = ?", userID).Count(&stats.TotalGames)

	// 获取正确次数
	db.Model(&models.GameRecord{}).Where("user_id = ? AND is_correct = ?", userID, true).Count(&stats.CorrectGames)

	// 计算平均猜测次数
	db.Model(&models.GameRecord{}).Where("user_id = ?", userID).Select("COALESCE(AVG(guess_time), 0)").Scan(&stats.AverageGuesses)

	// 获取最高分
	var highestLeaderboard models.Leaderboard
	db.Where("user_id = ?", userID).Order("score DESC").First(&highestLeaderboard)
	stats.HighestScore = highestLeaderboard.Score

	// 获取总分
	var totalScore int
	db.Model(&models.Leaderboard{}).Where("user_id = ?", userID).Select("COALESCE(SUM(score), 0)").Scan(&totalScore)
	stats.TotalScore = totalScore

	// 获取游戏次数（排行榜记录）
	var gamesPlayed int64
	db.Model(&models.Leaderboard{}).Where("user_id = ?", userID).Count(&gamesPlayed)
	stats.GamesPlayed = int(gamesPlayed)

	// 计算胜率
	if stats.TotalGames > 0 {
		stats.WinRate = float64(stats.CorrectGames) / float64(stats.TotalGames) * 100
	}

	// 计算平均分
	if stats.GamesPlayed > 0 {
		stats.AverageScore = float64(stats.TotalScore) / float64(stats.GamesPlayed)
	}

	// 获取最佳难度（得分最高的难度）
	var bestDifficulty models.Leaderboard
	db.Where("user_id = ?", userID).Order("score DESC").First(&bestDifficulty)
	stats.BestDifficulty = bestDifficulty.Difficulty

	// 获取最后游戏时间
	var lastGame models.Leaderboard
	db.Where("user_id = ?", userID).Order("created_at DESC").First(&lastGame)
	if lastGame.ID != 0 {
		stats.LastPlayed = lastGame.CreatedAt.Format("2006-01-02 15:04:05")
	}

	c.JSON(http.StatusOK, stats)
}

// GetLeaderboard 获取排行榜数据
func GetLeaderboard(c *gin.Context) {
	var leaderboardEntries []models.Leaderboard

	// 获取难度参数，如果没有则返回所有难度的排行榜
	difficulty := c.Query("difficulty")

	// 获取限制数量，默认返回前10名
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	// 构建查询
	query := db.Order("score DESC")

	if difficulty != "" {
		difficultyInt, err := strconv.Atoi(difficulty)
		if err == nil {
			query = query.Where("difficulty = ?", difficultyInt)
		}
	}

	// 执行查询
	result := query.Limit(limit).Find(&leaderboardEntries)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, leaderboardEntries)
}

// AddLeaderboardEntry 添加排行榜记录
func AddLeaderboardEntry(c *gin.Context) {
	var entry struct {
		UserId     string `json:"user_id" binding:"required"`
		PlayerName string `json:"player_name" binding:"required"`
		Score      int    `json:"score"`
		Difficulty int    `json:"difficulty" binding:"required"`
	}

	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 创建排行榜记录
	leaderboardEntry := models.Leaderboard{
		UserID:     entry.UserId,
		PlayerName: entry.PlayerName,
		Score:      entry.Score,
		Difficulty: entry.Difficulty,
	}

	if err := db.Create(&leaderboardEntry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save leaderboard entry"})
		return
	}

	c.JSON(http.StatusOK, leaderboardEntry)
}
