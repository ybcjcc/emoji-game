package models

import (
	"time"
)

// Word 表示一个词语及其对应的emoji
type Word struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Word       string    `json:"word" gorm:"not null"`
	Emoji      string    `json:"emoji" gorm:"not null"`
	Difficulty int       `json:"difficulty" gorm:"default:1"` // 难度等级(1-5)
	CreatedAt  time.Time `json:"created_at"`
}

// GameRecord 记录游戏结果
type GameRecord struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	WordID    uint      `json:"word_id"`
	UserID    string    `json:"user_id"`    // 用户标识（IP或session）
	IsCorrect bool      `json:"is_correct"` // 是否答对
	GuessTime int       `json:"guess_time"` // 猜测次数
	CreatedAt time.Time `json:"created_at"`
	Word      Word      `json:"word" gorm:"foreignKey:WordID"` // 关联的词语
}

// Leaderboard 排行榜记录
type Leaderboard struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	PlayerName string    `json:"player_name" gorm:"not null"` // 玩家名称
	UserID     string    `json:"user_id"`                     // 用户标识（IP或session）
	Score      int       `json:"score" gorm:"not null"`       // 得分
	Difficulty int       `json:"difficulty" gorm:"default:1"` // 游戏难度
	CreatedAt  time.Time `json:"created_at"`
}
