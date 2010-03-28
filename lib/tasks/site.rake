namespace :site do

  desc "Migrate-and-test task suitable for continuous integration of this application's extensions"
  task :build do
    RAILS_ENV = ENV['RAILS_ENV'] = 'test'
    ['ci:configure', 'db:migrate', 'site:migrate', 'spec:extensions'].each do |task|
      Rake::Task[task].invoke
    end
  end

  desc "Run all extension migrations in a sequence that observes their dependencies"
  task :migrate => :environment do
    require 'radiant/extension_migrator'
    %w{share_layouts reader taggable paperclipped event_calendar}.each do |t| 
      Rake::Task["radiant:extensions:#{t}:migrate"].invoke
    end
    Radiant::ExtensionMigrator.migrate_extensions
  end

end