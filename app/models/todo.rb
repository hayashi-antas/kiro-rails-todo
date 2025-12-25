class Todo < ApplicationRecord
  belongs_to :user

  enum :status, { open: 0, done: 1 }

  validates :title, presence: true
  validates :position, presence: true, uniqueness: { scope: :user_id }
  validate :title_not_blank

  scope :ordered, -> { order(:position) }

  private

  def title_not_blank
    if title.present? && title.strip.empty?
      errors.add(:title, "can't be blank")
    end
  end
end
